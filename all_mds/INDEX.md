# all_mds — project docs & notes

Everything that used to sit loose in the repository root. Only `CLAUDE.md`, `README.md`,
`.gitignore` and the CloudFront `*.pem` keys stay at the root; the keys stay because
`main_website/backend/.env` points at them with `../../cloudfront_private_key.pem`.

## Live documents (keep these current)

| File | What it is |
|---|---|
| [MEMORY.md](MEMORY.md) | Source of truth for the architecture: folder responsibilities, per-file purpose/risk, API map, DB schema, task→file index. Update it whenever the architecture changes (rule-1). |
| [ISSUES.md](ISSUES.md) | Bug/security audit from 2026-10-30 with exact `path:line` locations and IDs (`A1`, `S6`, `G1`…). Check before touching auth, uploads, payments, assessments, gigs, community or courses. The only file here tracked in git. |
| [content.md](content.md) | Page-by-page map of every piece of user-facing content, with navigation between pages. |
| [workpro.md](workpro.md) | How users move through the product: flows, free vs paid. Companion to `content.md`. |
| [systemdesign.md](systemdesign.md) | Server-side design rules and the high-load plan (stateless API, DB pooling, Redis, caching, uploads, workers), with the current gaps to fix first. |

## History & handoffs (reference only, not maintained)

| File | What it is |
|---|---|
| [CONTINUATION.md](CONTINUATION.md) | Question-bank handoff, 2026-07-23, branch `feat/question-bank-spine`. |
| [task.md](task.md) | Question-bank roadmap, 2026-07-21. |
| [HANDOFF_TEMP_QUESTION_BANK.md](HANDOFF_TEMP_QUESTION_BANK.md) | Interim ship-fast question bank, 2026-07-20. |
| [ANTIGRAVITY_HANDOFF.md](ANTIGRAVITY_HANDOFF.md) | Question bank phases 0–6, written for another assistant. Pre-dates the Postgres migration (still says MongoDB). |
| [AlignGrade_Scale_Plan.md](AlignGrade_Scale_Plan.md) | Scaling plan for 7,000+ concurrent users. Pre-dates the Postgres migration. |
| [commit.md](commit.md) | Walk-through of three older commits. |

## Scratch files

| File | What it is |
|---|---|
| `auth.txt` | Pasted transcript of an auth requirements review. |
| `fileds.txt` | Numbered list of skill/field names. |
| `my_resume.pdf` | The layout reference the student resume generator matches. |

Related, and left where they were: `docs/` (specs and architecture),
`design_stitch/` (design references), `.agents/rules/` (working rules).
