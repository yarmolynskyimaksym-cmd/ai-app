export interface TelegramMessage { id: string; author: string; text: string; date: string }

const MOCK: TelegramMessage[] = [
  { id: "tg_1", author: "Марія Агент", text: "Клієнт скаржиться на затримку виплати вже 3 дні! Що робити?", date: "2026-06-19T07:15:00Z" },
  { id: "tg_2", author: "Петро Агент", text: "Скільки лідів треба закрити цього місяця?", date: "2026-06-19T08:30:00Z" },
  { id: "tg_3", author: "Оксана Агент", text: "Не можу увійти в систему, пароль не підходить", date: "2026-06-19T09:00:00Z" },
  { id: "tg_4", author: "Дмитро Агент", text: "Зробив 15 дзвінків сьогодні, 3 зацікавлені клієнти", date: "2026-06-19T10:00:00Z" },
  { id: "tg_5", author: "Марія Агент", text: "Клієнт Іваненко відмовляється від договору, потрібна ваша допомога ТЕРМІНОВО", date: "2026-06-19T10:45:00Z" },
];

export async function getTelegramMessages(): Promise<TelegramMessage[]> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return MOCK;
  try {
    const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates?timeout=0&limit=50`);
    const data = await res.json();
    if (!data.ok) return MOCK;
    return data.result
      .filter((u: { message?: { text?: string } }) => u.message?.text)
      .map((u: { update_id: number; message: { from?: { first_name?: string; username?: string }; text: string; date: number } }) => ({
        id: `tg_${u.update_id}`,
        author: u.message.from?.first_name || u.message.from?.username || "Агент",
        text: u.message.text,
        date: new Date(u.message.date * 1000).toISOString(),
      }));
  } catch { return MOCK; }
}
