// Question provider: Groq Llama 3.3 70B (fallback) — the model this project uses for
// offline batch generation. Throws on transport failure (with .status) so the caller
// can retry on 429. Same Groq endpoint/auth as the existing mcq provider — no new provider.
async function generate(skillName, subtopic, systemPrompt, userPrompt, apiKey) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey || process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      max_tokens: 4096,
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
  if (!Array.isArray(parsed.questions) || !parsed.questions.length) {
    throw new Error('Groq returned no questions array');
  }
  return parsed.questions;
}

module.exports = { generate };
