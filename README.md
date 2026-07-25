# AlignGrade - Recruitment & Skill Verification Platform

AlignGrade is a premium, full-stack recruitment platform featuring role-based candidate matching and direct skill validation workflows. 

## Features
- **Align Grade Engine**: Automated candidate-to-job matching matching student ratings against minimum requirements.
- **Interactive Validation Lab**: Custom tests in React, Rust, Kubernetes, Python, and SQL to verify levels and instantly upgrade candidates' profiles.
- **Minimalist Stitch Aesthetics**: Dark theme layout using premium fonts, customized glassmorphic panels, and metrics dashboards.
- **Enterprise Verification**: Verification document upload interface for recruiters.

## Setup Instructions

### Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Start the backend developer server:
   ```bash
   npm run dev
   ```
   *Note: Runs on `http://localhost:5001`. Fallbacks transparently to an in-memory database if no MongoDB URL is provided.*

### Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Start the Vite React development server:
   ```bash
   cd frontend
   npm run dev
   ```
   *Note: Runs on `http://localhost:5173`. Open this URL in your web browser.*

---

## Question Bank & Database Deployment Guide

Follow this guide to seed the **143 Canonical Skills**, **36 Skill Roadmaps**, and **4,770 Question Bank MCQs** into any target MongoDB Atlas database.

### Prerequisites
1. Ensure `DATABASE_URL` in `backend/.env` points to your target MongoDB database instance (requires replicaSet enabled for Prisma transactions, e.g. `mongodb+srv://...`).
2. Run Prisma client generation:
   ```bash
   cd backend
   npx prisma generate
   ```

### Step 1: Seed Canonical Skill Registry (143 Skills)
Seeds the canonical skills and alias mapping table:
```bash
cd backend
npm run bank -- seed-skills --commit
```

### Step 2: Seed Skill Roadmaps (36 Skills)
Seeds the interview roadmaps (subtopics structure) into the database:
```bash
cd backend
node -e '
require("dotenv").config();
const { prisma } = require("./src/config/db");
const rms = require("./scripts/output/roadmaps.json");
(async()=>{
  let c=0, u=0;
  for (const r of rms) {
    const ex = await prisma.skillRoadmap.findUnique({ where: { skillName: r.skillName } }).catch(() => null);
    if (ex) { 
      await prisma.skillRoadmap.update({ where: { skillName: r.skillName }, data: { popularityRank: r.popularityRank, subtopics: r.subtopics } }); 
      u++; 
    } else { 
      await prisma.skillRoadmap.create({ data: { skillName: r.skillName, popularityRank: r.popularityRank, subtopics: r.subtopics } }); 
      c++; 
    }
  }
  console.log("Roadmaps created:", c, "updated:", u);
  process.exit(0);
})();
'
```

### Step 3: Validate Question Bank (Dry Run)
Runs a dry-run check to validate all 4,770 questions without writing to the database:
```bash
cd backend
npm run bank:seed
```

### Step 4: Seed Question Bank (4,770 MCQs)
Populates the `Question` collection in MongoDB with the pre-generated interview questions (idempotent & resumable):
```bash
cd backend
npm run bank:seed -- --commit
```

### Step 5: Verify Integrity
Runs all integrity checks to confirm database state:
```bash
cd backend
npm run bank:verify
```
*Expected result: `ALL INTEGRITY CHECKS PASSED`.*
