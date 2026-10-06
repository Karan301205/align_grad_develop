// MCQ provider: Claude on AWS Bedrock (primary).
// Returns the parsed MCQ object on success, or `null` on any failure / invalid
// shape so the orchestrator can fall back to the next provider. Never throws —
// matching the original controller's Bedrock try/catch behavior and logs.
async function generate(skillName, systemPrompt, userPrompt) {
  try {
    console.log(`Attempting to generate MCQs for ${skillName} using Claude (us-east-1)...`);
    const bedrockRes = await fetch("https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-haiku-20240307-v1:0/invoke", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CLAUDE_API_KEY}`
      },
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      })
    });

    if (bedrockRes.ok) {
      const data = await bedrockRes.json();
      const content = data.content[0]?.text;
      const parsed = JSON.parse(content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1));
      if (parsed.questions && parsed.questions.length === 10) {
        console.log("Successfully generated MCQs using Bedrock.");
        return parsed;
      }
    } else {
      console.warn(`Bedrock API responded with status ${bedrockRes.status}`);
    }
  } catch (err) {
    console.error("Bedrock invocation error:", err.message);
  }
  return null;
}

module.exports = { generate };
