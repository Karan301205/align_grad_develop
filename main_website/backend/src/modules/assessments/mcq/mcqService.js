const { buildSystemPrompt, buildUserPrompt } = require('./prompts');
const bedrockProvider = require('./providers/bedrockProvider');
const groqProvider = require('./providers/groqProvider');

// Orchestrates MCQ generation across providers in priority order: try Claude on
// Bedrock first, then fall back to Groq. Preserves the original control flow and
// logging: the "Falling back to Groq" message is only emitted when Bedrock did
// not return a valid set. Adding a new provider = add a module and slot it into
// this chain (Open/Closed).
async function generate(skillName) {
  const systemPrompt = buildSystemPrompt(skillName);
  const userPrompt = buildUserPrompt(skillName);

  const bedrockResult = await bedrockProvider.generate(skillName, systemPrompt, userPrompt);
  if (bedrockResult) {
    return bedrockResult;
  }

  console.log(`Falling back to Groq for MCQ generation of ${skillName}...`);
  return groqProvider.generate(systemPrompt, userPrompt);
}

module.exports = { generate };
