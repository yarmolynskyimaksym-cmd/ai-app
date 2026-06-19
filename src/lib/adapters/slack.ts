// MOCK adapter — TODO: replace with real Slack API
export interface SlackMessage { id: string; author: string; channel: string; text: string; ts: string }

const MOCK_MESSAGES: SlackMessage[] = [
  { id: "1", author: "Іван Коваль", channel: "#bugs", text: "CRITICAL: API повертає 500 при логіні через Google на iOS 16", ts: "2026-06-19T06:10:00Z" },
  { id: "2", author: "Оля Марченко", channel: "#bugs", text: "На сторінці агента зникає кнопка 'Зберегти' після першого кліку", ts: "2026-06-19T07:30:00Z" },
  { id: "3", author: "Dmytro", channel: "#general", text: "Добрий ранок! Нагадую — дедлайн по звіту п'ятниця", ts: "2026-06-19T08:00:00Z" },
  { id: "4", author: "Сергій Бойко", channel: "#bugs", text: "Фільтр по даті не працює в Safari, баг з часовим поясом", ts: "2026-06-18T14:20:00Z" },
  { id: "5", author: "Katia", channel: "#bugs", text: "Помилка завантаження файлу більше 5MB, треба виправити ліміт", ts: "2026-06-18T11:05:00Z" },
];

export async function getSlackMessages(): Promise<SlackMessage[]> {
  return MOCK_MESSAGES;
}
