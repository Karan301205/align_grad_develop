// Roadmap provider: Claude on AWS Bedrock (primary). Returns a structured result
// { ok, subtopics?, status? } and never throws, so the orchestrator can both fall
// back AND detect an unavailable provider (e.g. 403 INVALID_PAYMENT_INSTRUMENT) to
// short-circuit it for the rest of a run. Mirrors the existing mcq bedrockProvider
// (same endpoint, same bearer auth) — no new provider is introduced.
async function generate(skillName, systemPrompt, userPrompt) {
  try {
    const res = await fetch(
      'https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-haiku-20240307-v1:0/invoke',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.CLAUDE_API_KEY}`,
        },
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      }
    );
    if (!res.ok) return { ok: false, status: res.status };
    const data = await res.json();
    const content = (data.content && data.content[0] && data.content[0].text) || '';
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start === -1 || end === -1) return { ok: false, status: 'no-json' };
    const parsed = JSON.parse(content.substring(start, end + 1));
    if (Array.isArray(parsed.subtopics) && parsed.subtopics.length) {
      return { ok: true, subtopics: parsed.subtopics.map(String) };
    }
    return { ok: false, status: 'bad-shape' };
  } catch (err) {
    return { ok: false, status: err.message };
  }
}

module.exports = { generate };
