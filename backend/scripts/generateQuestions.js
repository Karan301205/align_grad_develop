#!/usr/bin/env node
/**
 * Temporary question-bank generator.
 *
 * Pre-generates MCQs for the top-10 skills, tagged by subtopic, and writes them
 * to scripts/output/questions.json. Touches NO database — only the Groq HTTP API
 * and one local file. Seeding into MongoDB is a separate, human-run step
 * (scripts/seedQuestions.js).
 *
 * Primary model: Groq llama-3.3-70b-versatile (reliable JSON shape, fast, cheap).
 * Bedrock/Claude is SKIPPED by default because the AWS account currently returns
 * 403 INVALID_PAYMENT_INSTRUMENT; pass --bedrock to re-enable once billing is fixed.
 *
 *   node scripts/generateQuestions.js            # full run (10 skills x 5 subtopics = 500)
 *   node scripts/generateQuestions.js --smoke    # one (skill, subtopic) only, prints sample
 *
 * Requires backend/.env with GROQ_API_KEY.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Exact frontend spellings (frontend/src/constants/skills.js) so the serve-match is exact.
const SKILLS = {
  'Python': ['Data Types & Structures', 'Functions & OOP', 'Standard Library & Modules', 'Error Handling & Exceptions', 'Comprehensions & Iterators'],
  'JavaScript': ['Async & Promises', 'Closures & Scope', 'ES6+ Features', 'DOM & Events', 'Prototypes & this'],
  'Java': ['OOP & Inheritance', 'Collections Framework', 'Exceptions & Generics', 'Concurrency & Threads', 'Streams & Lambdas'],
  'React': ['Components & Props', 'Hooks', 'State Management', 'Rendering & Keys', 'Context & Performance'],
  'Node.js': ['Event Loop & Async', 'Modules & npm', 'Express & Middleware', 'Streams & Buffers', 'File System & Path'],
  'TypeScript': ['Types & Interfaces', 'Generics', 'Union & Narrowing', 'Classes & Access Modifiers', 'Utility Types'],
  'SQL': ['SELECT & Filtering', 'Joins', 'Aggregation & GROUP BY', 'Subqueries', 'Indexes & Constraints'],
  'Git and Github': ['Branching & Merging', 'Staging & Commits', 'Remotes & Push/Pull', 'Rebase & Reset', 'Pull Requests & Workflow'],
  'Docker': ['Images & Containers', 'Dockerfile', 'Volumes & Networking', 'Docker Compose', 'Registry & Tags'],
  'AWS': ['EC2 & Compute', 'S3 & Storage', 'IAM & Security', 'Lambda & Serverless', 'VPC & Networking'],
  // --- Next 20 popular technical skills (added 2026-07-20) ---
  'C++': ['Pointers & Memory', 'OOP & Classes', 'STL & Containers', 'Templates', 'RAII & Smart Pointers'],
  'C#': ['Types & OOP', 'LINQ', 'Async & Await', 'Collections & Generics', 'Exceptions & Delegates'],
  'C': ['Pointers & Memory', 'Arrays & Strings', 'Structs & Unions', 'Dynamic Allocation', 'Preprocessor & Compilation'],
  'Go': ['Goroutines & Channels', 'Slices & Maps', 'Interfaces', 'Error Handling', 'Structs & Methods'],
  'Rust': ['Ownership & Borrowing', 'Traits & Generics', 'Enums & Pattern Matching', 'Error Handling', 'Lifetimes'],
  'HTML': ['Semantic Elements', 'Forms & Inputs', 'Tables & Lists', 'Media & Embeds', 'Accessibility & ARIA'],
  'CSS': ['Selectors & Specificity', 'Box Model', 'Flexbox', 'Grid', 'Positioning & Responsive'],
  'MongoDB': ['CRUD Operations', 'Query Operators', 'Aggregation Pipeline', 'Indexing', 'Data Modeling'],
  'PostgreSQL': ['Queries & Joins', 'Indexes', 'Transactions & ACID', 'Constraints & Keys', 'Window Functions'],
  'MySQL': ['Queries & Joins', 'Indexes', 'Transactions', 'Storage Engines', 'Constraints & Keys'],
  'Kubernetes': ['Pods & Deployments', 'Services & Networking', 'ConfigMaps & Secrets', 'Volumes & Storage', 'Scaling & Scheduling'],
  'Express JS': ['Routing', 'Middleware', 'Request & Response', 'Error Handling', 'REST APIs'],
  'Django': ['Models & ORM', 'Views & URLs', 'Templates', 'Forms', 'Django REST Framework'],
  'FastAPI': ['Path & Query Params', 'Pydantic Models', 'Dependency Injection', 'Async Endpoints', 'Response & Status Codes'],
  'Machine Learning': ['Supervised Learning', 'Unsupervised Learning', 'Model Evaluation', 'Overfitting & Regularization', 'Feature Engineering'],
  'TensorFlow': ['Tensors & Operations', 'Keras API', 'Model Training', 'Layers & Activations', 'Saving & Loading Models'],
  'PyTorch': ['Tensors & Autograd', 'nn.Module', 'Training Loop', 'Optimizers & Loss', 'DataLoaders'],
  'Pandas': ['DataFrames & Series', 'Indexing & Selection', 'GroupBy & Aggregation', 'Merging & Joining', 'Missing Data'],
  'NumPy': ['Arrays & dtypes', 'Indexing & Slicing', 'Broadcasting', 'Array Operations', 'Linear Algebra'],
  'Linux': ['File System & Permissions', 'Shell Commands', 'Processes & Signals', 'Networking', 'Package Management'],
};

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const CONCURRENCY = Number(process.env.GEN_CONCURRENCY) || 3; // conservative for free-tier rate limits
const MAX_ATTEMPTS = 4;
const OUT_DIR = path.join(__dirname, 'output');
const OUT_FILE = path.join(OUT_DIR, 'questions.json');

function systemPrompt(skill, subtopic) {
  return `You are a technical evaluation engine. Generate exactly 10 multiple choice questions (MCQs) for the skill '${skill}', focused specifically on the subtopic '${subtopic}'. Return a JSON object with a single key 'questions' whose value is an array of exactly 10 objects. Each object must have: 'question' (string), 'options' (an array of exactly 4 distinct strings), and 'correctIndex' (an integer 0, 1, 2, or 3 giving the index of the correct option in 'options'). Mix conceptual and code/syntax questions and vary difficulty. Output only the JSON.`;
}
function userPrompt(skill, subtopic) {
  return `Generate the 10 MCQs for '${skill}' on '${subtopic}' now, as a JSON object.`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One Groq call with retry/backoff on 429/5xx. Returns parsed { questions:[...] } or null.
async function groqCall(skill, subtopic) {
  const body = JSON.stringify({
    model: GROQ_MODEL,
    response_format: { type: 'json_object' },
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt(skill, subtopic) },
      { role: 'user', content: userPrompt(skill, subtopic) },
    ],
  });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res;
    try {
      res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body,
      });
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) { console.warn(`  ! ${skill}/${subtopic} transport error: ${err.message}`); return null; }
      await sleep(1000 * attempt); continue;
    }

    if (res.status === 429 || res.status >= 500) {
      const ra = Number(res.headers.get('retry-after')) || attempt * 2;
      if (attempt === MAX_ATTEMPTS) { console.warn(`  ! ${skill}/${subtopic} gave ${res.status} after ${MAX_ATTEMPTS} tries`); return null; }
      await sleep(ra * 1000); continue;
    }
    if (!res.ok) { console.warn(`  ! ${skill}/${subtopic} HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`); return null; }

    try {
      const data = await res.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) { console.warn(`  ! ${skill}/${subtopic} unparseable JSON`); return null; }
      await sleep(500 * attempt);
    }
  }
  return null;
}

// Tolerant normalization → stored shape, or null if unsalvageable.
function normalizeQuestion(q, skill, subtopic) {
  if (!q || typeof q.question !== 'string' || !q.question.trim()) return null;

  // options: accept array of 4, or an object {A,B,C,D} / {0,1,2,3}.
  let options = q.options;
  if (!Array.isArray(options) && options && typeof options === 'object') options = Object.values(options);
  if (!Array.isArray(options) || options.length !== 4) return null;
  options = options.map((o) => String(o));

  // correct index: accept correctIndex (0-3), or a letter answer 'A'-'D', or numeric-in-answer.
  let idx = q.correctIndex;
  if (typeof idx !== 'number') {
    const a = String(q.answer != null ? q.answer : '').trim().toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(a)) idx = a.charCodeAt(0) - 65;
    else if (/^[0-3]$/.test(a)) idx = Number(a);
  }
  if (typeof idx !== 'number' || idx < 0 || idx > 3 || !Number.isInteger(idx)) return null;

  return { skillName: skill, subtopic, question: q.question.trim(), options, correctIndex: idx, source: 'temp-bank-groq' };
}

async function generateOne(skill, subtopic) {
  const parsed = await groqCall(skill, subtopic);
  const raw = parsed && Array.isArray(parsed.questions) ? parsed.questions : [];
  return raw.map((q) => normalizeQuestion(q, skill, subtopic)).filter(Boolean);
}

async function runPool(tasks, worker) {
  let idx = 0;
  async function lane() { while (idx < tasks.length) { const i = idx++; await worker(tasks[i]); } }
  await Promise.all(Array.from({ length: CONCURRENCY }, lane));
}

async function main() {
  if (!process.env.GROQ_API_KEY) { console.error('GROQ_API_KEY missing in backend/.env'); process.exit(1); }
  const smoke = process.argv.includes('--smoke');
  const fill = process.argv.includes('--fill');

  let tasks = [];
  for (const [skill, subs] of Object.entries(SKILLS)) for (const sub of subs) tasks.push({ skill, sub });
  if (smoke) tasks = tasks.slice(0, 1);

  // Fill mode: keep whatever is already in questions.json and only regenerate the
  // (skill, subtopic) pairs that are missing, then merge. Never loses existing data.
  let existing = [];
  if (fill && !smoke && fs.existsSync(OUT_FILE)) {
    try { existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) || []; } catch { existing = []; }
    const have = new Set(existing.map((q) => `${q.skillName}||${q.subtopic}`));
    tasks = tasks.filter((t) => !have.has(`${t.skill}||${t.sub}`));
    console.log(`Fill mode: keeping ${existing.length} existing questions; regenerating ${tasks.length} missing pairs.`);
  }

  console.log(`Generating for ${tasks.length} (skill, subtopic) pairs via ${GROQ_MODEL}, concurrency ${CONCURRENCY}${smoke ? ' [SMOKE]' : ''}...`);

  const all = [];
  const failures = [];
  await runPool(tasks, async ({ skill, sub }) => {
    const clean = await generateOne(skill, sub);
    if (!clean.length) { failures.push(`${skill}/${sub}`); console.log(`  x ${skill} / ${sub}`); return; }
    all.push(...clean);
    console.log(`  ok ${skill} / ${sub} — ${clean.length}/10 valid`);
  });

  if (smoke) {
    console.log('\n--- SMOKE SAMPLE (first 2) ---');
    console.log(JSON.stringify(all.slice(0, 2), null, 2));
    console.log(`\nSmoke valid: ${all.length}, failures: ${failures.length}. (no file written in smoke mode)`);
    return;
  }

  const written = existing.concat(all);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(written, null, 2));

  const bySkill = {};
  for (const q of written) bySkill[q.skillName] = (bySkill[q.skillName] || 0) + 1;
  console.log('\n=== SUMMARY ===');
  for (const [s, n] of Object.entries(bySkill)) console.log(`  ${s}: ${n}`);
  console.log(`  TOTAL: ${written.length} questions across ${Object.keys(bySkill).length} skills`);
  if (failures.length) console.log(`  FAILED pairs (${failures.length}): ${failures.join(', ')}`);
  console.log(`\nWrote ${OUT_FILE}`);
}

main().catch((err) => { console.error('Generator crashed:', err); process.exit(1); });
