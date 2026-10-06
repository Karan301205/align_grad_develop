// Provider-agnostic orchestrator for interview-MCQ generation. Tries providers in
// priority order (Claude on Bedrock -> Groq). Adding a provider = add a module and
// slot it into this chain. Once Bedrock reports unavailable in a run (e.g. 403 billing)
// it is short-circuited so the remaining subtopics go straight to the fallback.
const { buildSystemPrompt, buildUserPrompt } = require('./prompts');
const bedrockProvider = require('./providers/bedrockProvider');
const groqProvider = require('./providers/groqProvider');

let bedrockUnavailable = false;

async function generateQuestions(skillName, subtopic, opts = {}) {
  const systemPrompt = buildSystemPrompt(skillName, subtopic);
  const userPrompt = buildUserPrompt(skillName, subtopic);

  if (!bedrockUnavailable) {
    const b = await bedrockProvider.generate(skillName, subtopic, systemPrompt, userPrompt);
    if (b.ok) return { questions: b.questions, provider: 'bedrock-claude-3-haiku' };
    console.warn(`[qbank] Bedrock unavailable (${b.status}) — using Groq fallback for the rest of this run.`);
    bedrockUnavailable = true;
  }

  const questions = await groqProvider.generate(skillName, subtopic, systemPrompt, userPrompt, opts.groqKey);
  return { questions, provider: opts.groqLabel || 'groq-llama-3.3-70b' };
}

function _resetProviderState() {
  bedrockUnavailable = false;
}

module.exports = { generateQuestions, _resetProviderState };
