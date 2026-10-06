// Question provider: Claude on AWS Bedrock (primary). Returns { ok, questions?, status? }
// and never throws, so the orchestrator can fall back AND detect an unavailable provider
// (e.g. 403 billing) to short-circuit it. Same endpoint/bearer as the existing mcq
// provider — no new provider introduced.
async function generate(skillName, subtopic, systemPrompt, userPrompt) {
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
          max_tokens: 4000,
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
    if (Array.isArray(parsed.questions) && parsed.questions.length) {
      return { ok: true, questions: parsed.questions };
    }
    return { ok: false, status: 'bad-shape' };
  } catch (err) {
    return { ok: false, status: err.message };
  }
}

module.exports = { generate };
