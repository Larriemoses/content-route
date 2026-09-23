type ChatRequest = { system: string; user: string; model: string };

export async function requestStructuredCompletion(input: ChatRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  if (!apiKey) throw new Error('OpenRouter is not configured');

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://content-route.vercel.app' },
    body: JSON.stringify({ model: input.model, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: input.system }, { role: 'user', content: input.user }] }),
  });
  if (!response.ok) throw new Error(`OpenRouter request failed: ${response.status}`);
  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('OpenRouter returned no structured content');
  return JSON.parse(content) as unknown;
}
