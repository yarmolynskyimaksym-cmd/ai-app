import Anthropic from "@anthropic-ai/sdk";

// Інстанціюється тільки на сервері — API ключ ніколи не потрапляє в клієнт
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
