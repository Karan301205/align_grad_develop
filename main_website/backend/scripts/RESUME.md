# Question Bank — Save Point (resume when tokens reset, ~9:30pm IST)

## Current state
- **Bank: 4,223 MCQs, 31 skills fully complete** (every subtopic exactly 10/10, strict interview bar).
- File: `backend/scripts/output/questionBank.json`
- Backups: `backend/scripts/output/questionBank.backup.json` and scratchpad `questionBank.savepoint.json`.

## Tooling (all recreated after the earlier accidental deletion)
- `backend/scripts/haikuMerge.js` — self-contained validator + dedup + buildRow. Usage:
  `node scripts/haikuMerge.js <file-or-dir> [--source=haiku] [--replace]` (dir = folder of per-subtopic JSON arrays).
- `backend/scripts/haikuAuthoringSpec.md` — strict authoring bar.
- `backend/scripts/output/roadmaps.json` — 36 started skills (subtopics + popularityRank).

## Method that works (token-efficient, crash-proof)
Dispatch Haiku subagents (model: haiku) that AUTHOR questions themselves (never call an API).
Each writes ONE file per subtopic (10 Qs, single Write, no rewrite) to
`/Users/karanrawat/Desktop/a_g/backend/scripts/output/parts/<skill>/NN.json` (ABSOLUTE paths).
Then merge the folder with haikuMerge. Author small fills inline for any subtopic the validator trims below 10.

## REMAINING — finish these 5 started skills first
Per-subtopic files already partly done; regenerate the SHORT subtopics into their dirs, then merge:
- **C#** (dir `parts/csharp`, have 10): short = Data Types, Operators, Control Flow, Functions, OOP, Exception Handling, File Input Output, Multi Threading, Lambda Expressions, LINQ Queries, Async Programming, Performance Optimization, Design Patterns
- **Go** (dir `parts/golang`, have 11): short = Data Types, Control Structures, Functions, Error Handling, Goroutines, Channels, Concurrency, Go Modules, System Programming, Performance Optimization, Memory Management, Testing Strategies, Go Architecture
- **Express JS** (dir `parts/expressjs`, have 11): short = Node JS Basics, Express Framework, Routing Mechanisms, Middleware Functions, Request Response Objects, Template Engine Integration, Database Connectivity, Error Handling Techniques, API Security Best Practices, Performance Optimization, Scalable Architecture
- **Next.js** (dir `parts/nextjs`, have 11): short = Next.js Installation, Page Routing System, Server Side Rendering, Static Site Generation, Client Side Rendering, Get Static Props, Internationalization Support, Performance Optimization, Error Handling Mechanisms, Security Best Practices, Production Deployment Strategies, Serverless Architecture
- **FastAPI** (dir `parts/fastapi2`, have 70): short = Async Programming, Database Integration, Security Best Practices, Performance Optimization, API Documentation, Testing Strategies

Exact subtopic→file mappings are in `roadmaps.json`. Merge command per skill, e.g.:
`node scripts/haikuMerge.js scripts/output/parts/csharp --source=haiku`

## AFTER the 5 are done (36 started skills complete = ~4,700 MCQs)
The other **107 skills (popularityRank 37–143)** were never started. Their subtopics lived only in the
deleted `roadmaps.json` and are NOT recoverable from transcripts. Before generating them, regenerate
roadmap subtopics for those 107 skills (skill names are in git: `backend/src/services/questionBank/skills/seedData.json`,
143 entries with canonicalName/slug). Then generate questions the same way.

## Incident note / safeguards
- Earlier this session an errant `rm -rf scripts` (run after a `cd backend` in the same command) deleted
  `backend/scripts/`. 15 skills were recovered from subagent transcripts; 20 were regenerated. 
- SAFEGUARDS going forward: never chain `rm` after a `cd` in one command; keep `questionBank.backup.json`
  updated after each wave; consider `git add -f` on the bank to version it.

## DB persistence (human-only, do NOT run from agent)
`node scripts/seedQuestionBank.js --commit` was the intended DB seed — that script was also deleted and
must be recreated before committing to MongoDB (Atlas is production; read the mock-DB safeguards in MEMORY.md).
Phase 4 (lifecycle/replacement) remains BLOCKED pending explicit approval.
