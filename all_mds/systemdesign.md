# AlignGrad — System Design Rules

The design rules the server side has to follow, and what has to change before it can take high user load.
Covers `main_website` (Express + Prisma, port 5001) and `admin_ws` (Express + raw `pg`, port 5002). Both
apps share one PostgreSQL database and one S3 bucket.

Written 2026-11-18. Items marked **GAP** describe how the code works today and need fixing before a traffic spike.

---

## 1. Target shape

```
            Browser (React SPA, static build)
                 │
        CDN (CloudFront) ── static assets, course video (signed URLs), public media
                 │
        Load balancer / Nginx (TLS, gzip, request size caps, timeouts)
                 │
   ┌─────────────┼─────────────┐
 API node 1   API node 2   API node N      ← stateless Express, PM2 cluster / containers
   └─────────────┼─────────────┘
                 │
     Redis (rate limits, auth backoff, cache, job queue)
                 │
     PgBouncer (transaction pooling)
                 │
     PostgreSQL primary  ──►  read replica (later)
                 │
     Worker process(es): email, job expiry, cleanup, heavy reports
```

The API tier must be **stateless**, so any request can land on any node and nodes can be added or removed freely.

---

## 2. Server-side rules (every change)

1. **Stateless API nodes.** Nothing that matters lives in process memory: no in-memory sessions, counters, caches
   or queues. Use the DB or Redis. JWTs stay the auth mechanism (no server sessions).
2. **Layering.** `routes → validate → auth/role guard → controller → service → repository (Prisma)`. Controllers
   stay thin; business rules live in services in `src/modules/<domain>/`.
3. **Every route enforces role and ownership on the server.** There is no global role middleware (ISSUES A2), so
   each handler checks `req.user.role` and that the record belongs to the caller.
4. **Validate every input.** Schemas are plain objects `{ body, params, query }`; a bare `z.object` is skipped
   (ISSUES A7). Cap pagination (`limit` ≤ 50–100) and string lengths.
5. **No work on the request path that doesn't need to be there.** Email, job expiry, cleanup, report generation
   and anything slow go to a background worker or cron, not inside a request.
6. **Timeouts everywhere.** Outgoing calls (SMTP, S3, Razorpay, Google) get explicit timeouts. A slow third
   party must never hold an API worker indefinitely.
7. **Idempotent writes for money and side effects.** Payment verification, enrollments and hire/apply actions
   must be safe to retry (unique constraints + "already done" checks), because clients and load balancers retry.
8. **Errors.** 5xx responses never carry internals; the cause goes to the server log. No fake-data fallback.
9. **Config only from env.** No hardcoded hosts, buckets or URLs. Secrets never in git or logs.
10. **`admin_ws` stays decoupled.** It shares only PostgreSQL and S3 with `main_website`, never code.

---

## 3. Database (PostgreSQL)

The database is the first thing that will fall over under load. Rules:

- **Connection budget.** Each Prisma client opens a pool (default `num_cpus * 2 + 1`). N API nodes × pool size
  must stay below Postgres `max_connections`. The shared dev server already runs out of slots (P2037).
  - Set `connection_limit` and `pool_timeout` on `DATABASE_URL` explicitly.
  - Put **PgBouncer** (transaction mode, `pgbouncer=true` in the Prisma URL) in front of Postgres before scaling out.
  - Admin `pg.Pool`: set `max`, `idleTimeoutMillis`, `connectionTimeoutMillis`.
- **Index every filter and sort column** used by list endpoints (foreign keys like `studentId`, `jobId`,
  `recruiterId`, `communityId`; `status`, `createdAt`, `expiresAt`). Check hot queries with `EXPLAIN ANALYZE`.
- **Always paginate.** No unbounded `findMany`. Prefer cursor pagination (`createdAt, id`) for feeds and lists.
- **No N+1.** Use `include`/`select` or one batched `IN (...)` query, not a query per row in a loop.
- **Select only needed columns**, especially large JSONB (`Profile.skills/education`, `Course.modules`,
  `Application.answers`). Don't return whole rows to list views.
- **Counters and aggregates:** don't run `count(*)` over big tables per request; keep counter columns or cache them.
- **Transactions** for multi-row writes that must succeed together (apply + usage counts, payment + entitlement).
  Keep them short; no network calls inside a transaction.
- **Schema changes** only via reviewed migrations (`npm run db:migrate`). Never `prisma db push` on a shared DB.
  Add indexes with `CREATE INDEX CONCURRENTLY` on big tables.
- **Later:** a read replica for read-heavy endpoints (job browse, course catalog, community feed); daily backups
  plus point-in-time recovery on production.

---

## 4. High-load design

### 4.1 Scale the API horizontally
- Run several Node processes per machine (PM2 cluster mode or containers), then several machines behind a load
  balancer. Node is single-threaded, so one process per CPU core.
- Graceful shutdown: on `SIGTERM` stop accepting connections, finish in-flight requests, close Prisma/pg pools.
- `/health` must be cheap (`SELECT 1`), not a table count.

### 4.2 Move shared state to Redis
- Rate limits and failed-login backoff must be counted in Redis so every node sees the same totals.
- Use Redis for short-lived caches and as the backing store for a job queue (e.g. BullMQ).

### 4.3 Cache read-heavy data
| Data | Strategy |
|---|---|
| Skill registry, skill lists, course catalog | In-process cache with TTL, or Redis; invalidate on admin change |
| Public job list / job brief | Redis, 30–120 s TTL |
| Community feed (first page) | Redis, short TTL |
| Static frontend build, images | CDN with long cache headers (hashed filenames) |
| Course video / documents | CloudFront signed URLs (already in place) |

Never cache per-user private data in a shared key, and never cache anything containing answer keys.

### 4.4 Uploads and media
- Large files must not pass through API memory. Target: the client uploads **directly to S3 with a presigned
  URL** (size and content-type locked in the signature), then the server validates (magic bytes via a ranged GET,
  or an S3-event worker) before marking the file usable.
- All media is served from S3/CloudFront, never streamed through Express.

### 4.5 Background work
- A separate worker process handles email, job expiry, cleanup and any LLM/offline generation.
- Scheduled jobs (job expiry, session cleanup) run once per schedule in one place, not on every API request and
  not on every node.

### 4.6 Protect the system
- Per-user and per-IP rate limits, stricter on auth, OTP/password reset, uploads, test generation and payments.
- Request body caps (already 1 MB for JSON); server and load balancer timeouts; restrict CORS to the real
  frontend origins.
- Add security headers (`helmet`) and gzip/brotli at Nginx.
- Assessment sessions (`TestSession`) stay single-use with expiry so they cannot be replayed under load.

### 4.7 Observability
- Structured JSON logs with a request ID on every line; ship them off the box.
- Track per-route latency (p50/p95/p99), error rate, DB pool wait time, slow queries (`pg_stat_statements`),
  CPU/memory per node.
- Alerts on 5xx rate, p95 latency, DB connections near the limit, and disk.

### 4.8 Load testing before launches
- Run k6 (or similar) against a staging copy, **never** prod or the shared dev DB.
- Scenarios: login burst, job browse + apply, test generate + submit, community feed, course video start.
- Suggested targets: p95 < 300 ms for reads, < 800 ms for writes, error rate < 0.5% at expected peak × 2.

---

## 5. Current gaps to fix first (priority order)

| # | GAP | Where | Fix |
|---|---|---|---|
| 1 | Rate limiter and auth backoff use in-memory `Map`s, so each node counts separately and memory grows | `main_website/backend/src/middleware/rateLimiter.js` | Redis-backed counters |
| 2 | Upload proxy buffers up to 100 MB per request in Node memory (`express.raw`) | `src/index.js`, `modules/uploads/upload.controller.js` | Presigned direct-to-S3 upload + async validation |
| 3 | `purgeExpiredJobs` hard-deletes on every job list/post request (ISSUES S12) | `modules/jobs/jobLifecycle.service.js` | Scheduled worker; soft-expire instead of delete |
| 4 | No explicit DB pool limits or PgBouncer | Prisma `DATABASE_URL`, `admin_ws/backend/src/config/database.js` | Set limits; add PgBouncer |
| 5 | `/health` runs `prisma.user.count()` and the frontend polls it | `src/index.js` | `SELECT 1` |
| 6 | `cors()` allows every origin | `src/index.js` | Allow-list from env (`CLIENT_URL` etc.) |
| 7 | Emails sent inline in request handlers | auth, recruiter verification (admin) | Queue + worker |
| 8 | Missing role guards on some routes (ISSUES A2) and skipped validation (ISSUES A7) | see `ISSUES.md` | Fix per item |

---

## 6. Checklist for any new feature

- [ ] Role + ownership checked server-side; input validated with a `{ body, params, query }` schema
- [ ] List endpoints paginated with a capped `limit`; queries use indexes; no N+1
- [ ] No in-memory state; anything slow runs in the worker
- [ ] Outgoing calls have timeouts; writes with side effects are idempotent
- [ ] No answer keys, verification docs or internals in responses
- [ ] Migration reviewed; matching mock method added for new Prisma calls
- [ ] `all_mds/MEMORY.md` updated if routes, schema or top-level files changed
