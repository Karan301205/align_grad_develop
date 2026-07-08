# AlignGrade — Scaling Plan for 7,000+ Concurrent Users (Low-Budget)

## 1. Where the codebase stands today (from MEMORY.md)

AlignGrade is a single Express process with no clustering, a Prisma/MongoDB layer that silently swaps to an **in-memory mock database** if `DATABASE_URL` is missing or unreachable, JWT auth with no rate limiting, no caching layer, no queue for heavy work (video/resume uploads, MCQ generation via Bedrock/Groq), and no test suite or CI on either side. This is a solid single-user dev setup but has three hard blockers for 7,000 concurrent users: the mock-DB fallback must never be reachable in production (data would vanish on every restart), there is no horizontal scaling story (one Node process = one CPU core, capped around a few hundred concurrent connections doing real work), and MongoDB has no indexes defined beyond Prisma's implicit `_id`, so lookups like job matching by skill name or candidate search will degrade badly under load.

## 2. Target architecture (bootstrap budget)

```
Users → Cloudflare (free CDN/DNS/WAF) → Load-balanced Node instances (2-4x, stateless)
                                              │
                                    Redis (cache + session/rate-limit + BullMQ queue)
                                              │
                                    MongoDB Atlas M10/M20 (replica set, indexed)
                                              │
                                    Supabase Storage (resume/video, already in use)
```

Everything here is horizontally stateless except the DB and Redis, which is what lets you scale by adding process instances rather than rewriting the app.

## 3. Phased roadmap

**Phase 0 — Make prod safe (before anything else, 1-2 days)**
Hard-fail startup in `backend/src/config/db.js` if `DATABASE_URL` doesn't resolve to a real Atlas cluster in production (`NODE_ENV=production` should throw, not fall back to mock). Add `PORT`, `JWT_SECRET`, `DATABASE_URL` validation via a small env-check at boot in `backend/src/index.js`. Turn on MongoDB Atlas M10 (~$57-110/mo) with a 3-node replica set (required for Prisma transactions, which the CLAUDE.md notes you already need).

**Phase 1 — Database correctness & indexing (2-3 days)**
Add explicit indexes in `backend/prisma/schema.prisma`: unique index on `User.email` (likely missing formally), compound index on `Profile.skills.name` isn't directly indexable as embedded array in the same way relational DBs allow, so plan to add a top-level index on `userId` for `Profile`/`Company`, index `Job.createdAt` + `Job.companyId`, index `Application.jobId` + `Application.studentId`, index `TestAttempt.profileId`. Run `npx prisma db push` against the real Atlas cluster and verify with `db.collection.getIndexes()`. This directly addresses the "Alter Job Matching Algorithm Logic" hot path flagged as high-change-frequency in MEMORY.md — `getJobs`/`applyJob` do array/string comparisons per request today, which is fine at low volume but should be profiled once real traffic hits.

**Phase 2 — Horizontal scaling of the API (3-5 days)**
Confirm every controller is stateless (no in-process session storage) — currently true, since auth is JWT via `authMiddleware`. Deploy 2-4 instances of `backend/src/index.js` behind a load balancer (Render/Railway both handle this on paid tiers around $7-25/instance/mo; Fly.io if you want scale-to-zero economics for off-peak hours). Add `compression` and connection pool tuning for Prisma (`connection_limit` in the Mongo URI) so N instances × pool size doesn't exceed what Atlas M10 allows (M10 caps around 1500 connections — fine for 4 instances × ~50).

**Phase 3 — Caching & rate limiting (2-3 days)**
Add Redis (Upstash free/low tier is the bootstrap-friendly option, pay-per-request). Cache `GET /api/student/jobs` and `GET /api/recruiter/candidates` list responses for 30-60s with cache-busting on writes — these are read-heavy and identical across many users. Add `express-rate-limit` backed by Redis on `/api/auth/*` and test-submission endpoints to stop abuse from becoming a scaling problem in disguise.

**Phase 4 — Offload heavy work to a queue (3-4 days)**
MCQ generation (`generateMcqs()` calling Bedrock/Groq) and video/resume upload processing should not block a request thread under load. Move these to a BullMQ (Redis-backed) queue with a small worker pool; the client polls or gets a webhook/socket update. This is the single biggest latency risk at 7,000 concurrent users since LLM calls can take seconds.

**Phase 5 — Frontend & CDN (1-2 days)**
Serve the Vite build (`frontend/dist`) as static assets via Cloudflare Pages or the CDN in front of Render/Railway — free at this scale and removes all static-asset load from your Node instances entirely.

**Phase 6 — Observability & load testing (2-3 days)**
Add basic structured logging + a free-tier APM (e.g., Better Stack, Sentry free tier) before going live, not after. Run `k6` or `artillery` load tests simulating 7,000 concurrent connections against a staging replica of Phase 1-4 before committing to it — this is a plan, and the honest answer is you need a load test to confirm the tier choices above actually hold, rather than assuming they will.

## 4. Rough monthly cost at this scale (bootstrap tier)

MongoDB Atlas M10-M20 replica set: roughly $60-290/month depending on region/provider (M20 recommended once you have 7K concurrent, M10 is undersized for that volume). Compute (2-4 Node instances on Render/Railway): roughly $30-100/month combined. Redis (Upstash pay-per-request): typically under $20/month at this scale. Supabase Storage: usage-based, likely under $25/month unless video volume is heavy. Cloudflare CDN/DNS: free tier. Total estimate: roughly $150-450/month, well below enterprise-tier hosting, though you should treat these as planning numbers and re-check current published rates before committing budget, since cloud pricing shifts often.

## 4a. AWS pay-per-use track — detailed costing (build phase → production)

Two distinct phases, two very different bills. Do not confuse them — the build phase numbers are only valid while traffic stays low and the DB stays on M0.

**Build/test phase (current plan, $100 AWS credit available)**

| Service | Free allowance | Expected monthly cost while building |
|---|---|---|
| MongoDB Atlas M0 | Free forever (not AWS-billed) | $0 |
| AWS Lambda | 1M requests + 400,000 GB-seconds/month, permanent | $0 |
| API Gateway (HTTP API) | 1M calls/month free for first 12 months, then $1/million | $0 |
| S3 | 5GB storage + 20K GET/2K PUT/month, free for 12 months | $0 |
| CloudFront | 1TB transfer + 10M requests/month, free for 12 months | $0 |
| CloudWatch (billing alarms, basic logs) | Free tier covers this scale | $0 |
| **Build phase total** | | **$0–5/month**, credit stays almost untouched |

**Production phase (once you actually onboard toward 7,000 concurrent users)** — this requires swapping the database out of M0 (not production-safe) and sizing compute for real load:

| Service | Sizing basis | Estimated monthly cost |
|---|---|---|
| Database — Option A: MongoDB Atlas M20 dedicated | 4GB RAM/20GB storage, replica set, public endpoint (no NAT needed) | $145–290 |
| Database — Option B: AWS DocumentDB Serverless | $0.0822/DCU-hr + $0.10/GB storage, needs VPC | $120–250 |
| NAT Gateway (only if using DocumentDB / private-VPC DB) | Flat ~$32/mo + ~$0.045/GB processed | $32–60 (Option B only, $0 if Option A) |
| Lambda compute | Estimated 20–50M requests/month at 7K concurrent, 256MB avg | $30–100 |
| API Gateway (HTTP API) | Same request volume, $1/million after free tier | $20–50 |
| S3 (resumes/videos at scale) | Storage + request volume beyond free tier | $10–30 |
| CloudFront (frontend, beyond free tier) | $0.085/GB after 1TB | $10–40 |
| CloudWatch Logs/metrics at scale | Log volume from 7K concurrent traffic | $5–20 |
| Redis (Upstash or ElastiCache Serverless) | Cache + rate limit + queue, pay-per-use | $10–30 |
| **Production total — Option A (Atlas, recommended)** | | **~$230–560/month** |
| **Production total — Option B (DocumentDB)** | | **~$230–580/month** (similar cost, added compatibility risk) |

Option A and B land in the same range, so cost isn't the deciding factor between them — the Prisma/DocumentDB compatibility risk flagged earlier is. These are planning estimates, not quotes; the only way to pin down the real number is the Phase 6 load test, which will also tell you if the Lambda/API Gateway request-volume assumption above is realistic for your actual usage pattern.

**One-time costs, not monthly:** a short deliberate 7,000-concurrent load test run (~$10–30 for the hour or two it runs), and engineering time for the 6 phases (roughly 2–3 weeks), which isn't an AWS bill but is worth budgeting for as effort.

## 5. What I need from you to turn this into concrete tickets

Before I start making code changes, three things would sharpen the plan: expected read/write ratio (is this mostly students browsing jobs, or heavy concurrent test-taking events?), whether the 7,000 concurrent figure is steady-state or a burst (e.g., a scheduled test window), and which hosting provider you're leaning toward so Phase 2's exact config matches.

Sources:
- [MongoDB Pricing](https://www.mongodb.com/pricing)
- [Cluster Configuration Costs - Atlas - MongoDB Docs](https://www.mongodb.com/docs/atlas/billing/cluster-configuration-costs/)
- [Railway vs Render vs Fly.io for Solo Developers in 2026](https://devtoolpicks.com/blog/railway-vs-render-vs-fly-io-solo-developers-2026)
- [Fly.io vs Render: scaling in production 2026 — Northflank](https://northflank.com/blog/flyio-vs-render)
