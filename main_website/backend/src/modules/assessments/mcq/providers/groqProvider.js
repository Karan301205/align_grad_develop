// MCQ provider: Groq Llama 3.1 8B (fallback).
// Throws on transport failure or if it cannot produce exactly 10 questions —
// matching the original controller's Groq path so the caller surfaces the same
// error.
async function generate(systemPrompt, userPrompt) {
  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!groqRes.ok) {
    throw new Error(`Groq API failed with status ${groqRes.status}`);
  }

  const groqData = await groqRes.json();
  const parsed = JSON.parse(groqData.choices[0].message.content);
  if (parsed.questions && parsed.questions.length === 10) {
    return parsed;
  }
  throw new Error("Failed to generate exactly 10 questions");
}

module.exports = { generate };
