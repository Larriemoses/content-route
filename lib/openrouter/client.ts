type ChatRequest = { system: string; user: string; model: string };

export async function requestStructuredCompletion(input: ChatRequest) {
  if (process.env.AI_PROVIDER === 'gemini') return requestGeminiCompletion(input);
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  if (!apiKey) throw new Error('OpenRouter is not configured');

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://writeet.vercel.app', 'X-Title': 'Writeet' },
    body: JSON.stringify({ model: input.model, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: input.system }, { role: 'user', content: input.user }] }),
  });
  if (!response.ok) {
    if (response.status === 402) throw new Error('OpenRouter credits are unavailable for this key');
    throw new Error(`OpenRouter request failed: ${response.status}`);
  }
  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('OpenRouter returned no structured content');
  return JSON.parse(content) as unknown;
}

async function requestGeminiCompletion(input: ChatRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini is not configured');
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: input.system }] },
      contents: [{ role: 'user', parts: [{ text: input.user }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
  if (!response.ok) throw new Error(`Gemini request failed: ${response.status}`);
  const payload = await response.json();
  const content = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof content !== 'string') throw new Error('Gemini returned no structured content');
  return JSON.parse(content) as unknown;
}
