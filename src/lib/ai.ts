import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function askClaude(prompt: string, systemPrompt?: string): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    system: systemPrompt || "Ти помічник бізнес-девелопера. Відповідай українською. Повертай строгий JSON коли просять.",
    messages: [{ role: "user", content: prompt }],
  });
  return (msg.content[0] as { text: string }).text;
}

export async function askClaudeJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
  const text = await askClaude(prompt, systemPrompt);
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  const raw = match ? match[1] || match[0] : text;
  return JSON.parse(raw.trim()) as T;
}
