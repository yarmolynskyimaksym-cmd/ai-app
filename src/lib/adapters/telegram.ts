export interface TelegramMessage { id: string; author: string; username: string | null; text: string; date: string }

const MOCK: TelegramMessage[] = [
  { id: "tg_1", author: "Марія Агент", username: null, text: "Клієнт скаржиться на затримку виплати вже 3 дні! Що робити?", date: "2026-06-19T07:15:00Z" },
  { id: "tg_2", author: "Петро Агент", username: null, text: "Скільки лідів треба закрити цього місяця?", date: "2026-06-19T08:30:00Z" },
  { id: "tg_3", author: "Оксана Агент", username: null, text: "Не можу увійти в систему, пароль не підходить", date: "2026-06-19T09:00:00Z" },
];

// Опціональний allowlist контактів (через кому): TELEGRAM_ALLOWED_CONTACTS=ivan_petrov,maria_k
function getAllowlist(): string[] {
  return (process.env.TELEGRAM_ALLOWED_CONTACTS || "")
    .split(",")
    .map(s => s.trim().replace(/^@/, "").toLowerCase())
    .filter(Boolean);
}

interface TgUpdate {
  update_id: number;
  message?: {
    from?: { first_name?: string; last_name?: string; username?: string };
    text?: string;
    date: number;
  };
}

export async function getTelegramMessages(): Promise<TelegramMessage[]> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return MOCK;
  try {
    const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates?timeout=0&limit=100`);
    const data = await res.json();
    if (!data.ok) return MOCK;

    const allow = getAllowlist();
    return (data.result as TgUpdate[])
      .filter(u => u.message?.text && !u.message.text.startsWith("/"))
      .map(u => {
        const from = u.message!.from;
        const fullName = [from?.first_name, from?.last_name].filter(Boolean).join(" ");
        return {
          id: `tg_${u.update_id}`,
          author: fullName || from?.username || "Невідомий",
          username: from?.username?.toLowerCase() || null,
          text: u.message!.text!,
          date: new Date(u.message!.date * 1000).toISOString(),
        };
      })
      // якщо задано allowlist — лишаємо лише дозволені username
      .filter(m => allow.length === 0 || (m.username && allow.includes(m.username)));
  } catch {
    return MOCK;
  }
}
