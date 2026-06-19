export interface AgentMetric { name: string; current: number; prev: number }

const MOCK: AgentMetric[] = [
  { name: "Марія Коваленко", current: 142, prev: 120 },
  { name: "Петро Сидоренко", current: 98, prev: 110 },
  { name: "Оксана Бойко", current: 205, prev: 189 },
  { name: "Дмитро Мельник", current: 77, prev: 80 },
  { name: "Ірина Ткач", current: 160, prev: 145 },
  { name: "Олег Гончар", current: 55, prev: 90 },
];

export async function getAgentMetrics(): Promise<AgentMetric[]> {
  if (!process.env.AMPLITUDE_API_KEY || !process.env.AMPLITUDE_SECRET_KEY) return MOCK;
  try {
    const event = process.env.AMPLITUDE_EVENT || "agent_action";
    const groupBy = process.env.AMPLITUDE_GROUP_BY || "agent_name";
    const now = new Date();
    const end = now.toISOString().slice(0, 10).replace(/-/g, "");
    const start = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10).replace(/-/g, "");
    const url = `https://amplitude.com/api/2/events/segmentation?e={"event_type":"${event}"}&start=${start}&end=${end}&g=${groupBy}`;
    const res = await fetch(url, {
      headers: { Authorization: "Basic " + Buffer.from(`${process.env.AMPLITUDE_API_KEY}:${process.env.AMPLITUDE_SECRET_KEY}`).toString("base64") },
    });
    if (!res.ok) return MOCK;
    const data = await res.json();
    return Object.entries(data.data?.series || {}).map(([name, vals]: [string, unknown]) => {
      const arr = vals as number[];
      const half = Math.floor(arr.length / 2);
      return { name, current: arr.slice(half).reduce((a: number, b: number) => a + b, 0), prev: arr.slice(0, half).reduce((a: number, b: number) => a + b, 0) };
    });
  } catch { return MOCK; }
}
