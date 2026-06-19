export interface SlackMessage { id: string; author: string; channel: string; text: string; ts: string; permalink: string }

const CHANNEL_ID = "C0B1E0KUY14";
const TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK = "https://slack.com/api";

async function slackGet(method: string, params: Record<string, string>) {
  const url = new URL(`${SLACK}/${method}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${TOKEN}` } });
  return res.json();
}

export async function getSlackMessages(minutesBack = 70): Promise<SlackMessage[]> {
  if (!TOKEN) return getMockMessages();
  const oldest = String(Math.floor((Date.now() - minutesBack * 60 * 1000) / 1000));
  const data = await slackGet("conversations.history", { channel: CHANNEL_ID, oldest, limit: "100" });
  if (!data.ok || !data.messages) return [];
  return (data.messages as Array<Record<string, string>>)
    .filter(m => m.type === "message" && !m.subtype)
    .map(m => ({
      id: m.ts,
      ts: m.ts,
      author: m.username || m.user || "unknown",
      channel: "#bugs",
      text: m.text || "",
      permalink: `https://thecodestreet.slack.com/archives/${CHANNEL_ID}/p${m.ts.replace(".", "")}`,
    }));
}

export async function getThreadReplies(ts: string): Promise<string[]> {
  if (!TOKEN) return [];
  const data = await slackGet("conversations.replies", { channel: CHANNEL_ID, ts });
  if (!data.ok || !data.messages) return [];
  return (data.messages as Array<Record<string, string>>)
    .slice(1)
    .map(m => (m.text || "").toLowerCase());
}

function getMockMessages(): SlackMessage[] {
  return [
    { id: "1", ts: "1", author: "Іван Коваль", channel: "#bugs", text: "CRITICAL: API повертає 500 при логіні через Google на iOS 16", permalink: "#" },
    { id: "2", ts: "2", author: "Оля Марченко", channel: "#bugs", text: "Кнопка 'Зберегти' зникає після першого кліку на сторінці агента", permalink: "#" },
    { id: "3", ts: "3", author: "Dmytro", channel: "#general", text: "Добрий ранок! Дедлайн по звіту — п'ятниця", permalink: "#" },
    { id: "4", ts: "4", author: "Сергій Бойко", channel: "#bugs", text: "Фільтр по даті не працює в Safari, баг з часовим поясом", permalink: "#" },
  ];
}
