const AGENCY_IDS = ["13425676", "11205880", "18477687", "2093", "18714360", "20698379", "18589342", "2192"];

export interface AgencyMetrics {
  agencyId: string;
  wauCurrent: number; wauPrev: number;
  regCurrent: number; regPrev: number;
  dauYesterday: number; dauPrev7d: number;
  regYesterday: number; regPrev7d: number;
  healthScore: string;
}

// Legacy interface (старий код агент-самарі)
export interface AgentMetric { name: string; current: number; prev: number }

const BASE = "https://amplitude.com/api/2/events/segmentation";

function getAuth(): string | null {
  const key = process.env.AMPLITUDE_API_KEY;
  const secret = process.env.AMPLITUDE_SECRET_KEY;
  if (!key || !secret) return null;
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

// Дата YYYYMMDD у київському часі (UTC+3 влітку) зі зсувом на N днів
function kyivYmd(offsetDays: number): string {
  const d = new Date(Date.now() + 3 * 3600 * 1000);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

const SEGMENT = JSON.stringify([
  { prop: "gp:role", op: "is", values: ["host"] },
  { prop: "gp:agencyId", op: "is", values: AGENCY_IDS },
]);

// Повертає мапу agencyId -> масив значень по бакетах
async function segmentation(eventType: string, interval: number, start: string, end: string): Promise<Record<string, number[]>> {
  const auth = getAuth();
  if (!auth) return {};
  const url = new URL(BASE);
  url.searchParams.set("e", JSON.stringify({ event_type: eventType }));
  url.searchParams.set("m", "uniques");
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);
  url.searchParams.set("i", String(interval));
  url.searchParams.set("g", "gp:agencyId");
  url.searchParams.set("s", SEGMENT);
  try {
    const res = await fetch(url.toString(), { headers: { Authorization: auth } });
    if (!res.ok) return {};
    const json = await res.json();
    const labels: string[] = json.data?.seriesLabels?.map(String) || [];
    const series: number[][] = json.data?.series || [];
    const out: Record<string, number[]> = {};
    labels.forEach((label, i) => { out[label] = (series[i] || []).map(v => v ?? 0); });
    return out;
  } catch { return {}; }
}

function computeHealth(regYest: number, regPrev: number, dauYest: number, dauPrev: number): string {
  if (regYest === 0 && dauYest === 0) return "⚪";
  const regUp = regYest > regPrev;
  const dauUp = dauYest > dauPrev;
  if (regYest === 0 || (!regUp && !dauUp)) return "🔴";
  if (regUp && dauUp) return "🟢";
  return "🟡";
}

export async function getAgencyMetrics(): Promise<AgencyMetrics[]> {
  // Тижневі: ~4 бакети (вирівняні по понеділках), беремо останні два
  const wkStart = kyivYmd(-21), wkEnd = kyivYmd(0);
  // Денні: 8 бакетів, від -8 до вчора (-1)
  const dStart = kyivYmd(-8), dEnd = kyivYmd(-1);

  // Послідовно (паралель → таймаут в Amplitude)
  const weeklyReg = await segmentation("registration_partner_id_update", 7, wkStart, wkEnd);
  const weeklyWAU = await segmentation("server_credit_buy", 7, wkStart, wkEnd);
  const dailyReg = await segmentation("registration_partner_id_update", 1, dStart, dEnd);
  const dailyDAU = await segmentation("server_credit_buy", 1, dStart, dEnd);

  const last = (a: number[]) => a.length ? a[a.length - 1] : 0;
  const secondLast = (a: number[]) => a.length >= 2 ? a[a.length - 2] : 0;

  return AGENCY_IDS.map(id => {
    const wReg = weeklyReg[id] || [];
    const wWau = weeklyWAU[id] || [];
    const dReg = dailyReg[id] || [];
    const dDau = dailyDAU[id] || [];

    const wauCurrent = last(wWau), wauPrev = secondLast(wWau);
    const regCurrent = last(wReg), regPrev = secondLast(wReg);
    const dauYesterday = dDau[7] ?? 0, dauPrev7d = dDau[0] ?? 0;
    const regYesterday = dReg[7] ?? 0, regPrev7d = dReg[0] ?? 0;

    return {
      agencyId: id,
      wauCurrent, wauPrev, regCurrent, regPrev,
      dauYesterday, dauPrev7d, regYesterday, regPrev7d,
      healthScore: computeHealth(regYesterday, regPrev7d, dauYesterday, dauPrev7d),
    };
  });
}

export async function getAgentMetrics(): Promise<AgentMetric[]> {
  const metrics = await getAgencyMetrics();
  return metrics.map(m => ({ name: m.agencyId, current: m.wauCurrent, prev: m.wauPrev }));
}
