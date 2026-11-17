// Thin wrapper around Groq's OpenAI-compatible chat API.
export async function chat({ system, user, json = false, temperature = 0 }) {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(20000),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature,
      ...(json && { response_format: { type: "json_object" } }),
      messages: [{ role: "system", content: system }, { role: "user", content: user }]
    })
  });
  if (!r.ok) throw new Error(`Groq ${r.status}`);
  return (await r.json()).choices[0].message.content;
}
