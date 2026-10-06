// Roadmap provider: Groq Llama 3.3 70B (fallback) — the model this project already
// uses for offline batch generation (scripts/generateQuestions.js). Throws on
// transport failure (with .status set) so the caller can retry on 429 or surface
// the error. Same Groq endpoint/auth as the existing mcq provider — no new provider.
async function generate(skillName, systemPrompt, userPrompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    const err = new Error(`Groq API failed with status ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  if (!Array.isArray(parsed.subtopics) || !parsed.subtopics.length) {
    throw new Error('Groq returned no subtopics array');
  }
  return parsed.subtopics.map(String);
}

module.exports = { generate };
