// Prompt builders for skill-roadmap generation. Provider-agnostic: the same
// prompts are sent to whichever provider the orchestrator selects. Elicits an
// ordered interview syllabus (10-15 subtopics) per the Phase 2 requirements.
function buildSystemPrompt(skillName) {
  return [
    `You are an expert technical interviewer and curriculum designer.`,
    `Produce the definitive interview-preparation roadmap for the skill: '${skillName}'.`,
    `Output an ordered list of 10 to 15 subtopics that a strong candidate is expected`,
    `to master, as actually evaluated in real technical interviews.`,
    ``,
    `Rules:`,
    `- Order the subtopics as a learning progression: foundational first, then`,
    `  intermediate, ending with advanced / interview-focused topics.`,
    `- Across the list, cover (where relevant to this skill) practical engineering,`,
    `  production use cases, debugging, best practices, performance, and architecture.`,
    `- Each subtopic is a concise noun phrase (roughly 2-7 words): specific and`,
    `  interview-relevant, neither overly broad nor overly granular.`,
    `- No duplicate or overlapping subtopics. Vendor-neutral where appropriate.`,
    `- Exactly 10 to 15 subtopics.`,
    ``,
    `Return ONLY a JSON object of the form {"subtopics": ["...", "...", ...]} with the`,
    `subtopics in learning order. No explanation, no markdown, no extra keys.`,
  ].join('\n');
}

function buildUserPrompt(skillName) {
  return `Generate the interview roadmap subtopics for '${skillName}'.`;
}

module.exports = { buildSystemPrompt, buildUserPrompt };
