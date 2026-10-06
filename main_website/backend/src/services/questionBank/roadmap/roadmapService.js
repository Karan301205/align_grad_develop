// Provider-agnostic orchestrator for roadmap subtopic generation. Tries providers
// in priority order (Claude on Bedrock -> Groq). Adding a provider = add a module
// and slot it into this chain (Open/Closed). Once Bedrock reports unavailable in a
// run (e.g. 403 billing), it is short-circuited so the remaining skills go straight
// to the fallback instead of paying a failing round-trip each time.
const { buildSystemPrompt, buildUserPrompt } = require('./prompts');
const bedrockProvider = require('./providers/bedrockProvider');
const groqProvider = require('./providers/groqProvider');

let bedrockUnavailable = false;

async function generateRoadmap(skillName) {
  const systemPrompt = buildSystemPrompt(skillName);
  const userPrompt = buildUserPrompt(skillName);

  if (!bedrockUnavailable) {
    const b = await bedrockProvider.generate(skillName, systemPrompt, userPrompt);
    if (b.ok) return { subtopics: b.subtopics, provider: 'bedrock-claude-3-haiku' };
    console.warn(`[roadmap] Bedrock unavailable (${b.status}) — using Groq fallback for the rest of this run.`);
    bedrockUnavailable = true;
  }

  const subtopics = await groqProvider.generate(skillName, systemPrompt, userPrompt);
  return { subtopics, provider: 'groq-llama-3.3-70b' };
}

// Test/reset hook so a fresh run re-probes Bedrock.
function _resetProviderState() {
  bedrockUnavailable = false;
}

module.exports = { generateRoadmap, _resetProviderState };
