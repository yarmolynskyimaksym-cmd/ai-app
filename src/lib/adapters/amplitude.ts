const APP_ID = "426969";
const AGENCY_IDS = ["13425676","11205880","18477687","2093","18714360","20698379","18589342","2192"];

export interface AgencyMetrics {
  agencyId: string;
  wauCurrent: number; wauPrev: number;
  regCurrent: number; regPrev: number;
  dauYesterday: number; dauPrev7d: number;
  regYesterday: number; regPrev7d: number;
  healthScore: string;
}

// Legacy single-metric interface for backwards compat
export interface AgentMetric { name: string; current: number; prev: number }

function getAuth() {
  const key = process.env.AMPLITUDE_API_KEY;
  const secret = process.env.AMPLITUDE_SECRET_KEY;
  if (!key || !secret) return null;
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

function makeSegments() {
  return [{ conditions: [
    { type: "property", group_type: "User", prop_type: "user", prop: "gp:agencyId", op: "is", values: AGENCY_IDS },
    { type: "property", group_type: "User", prop_type: "user", prop: "gp:role", op: "is", values: ["host"] },
  ]}];
}

async function queryAmplitude(event_type: string, interval: number, range: string): Promise<Record<string, number[]>> {
  const auth = getAuth();
  if (!auth) return {};
  const body = {
    type: "eventsSegmentation", app: APP_ID,
    params: {
      range, interval,
      events: [{ event_type, filters: [], group_by: [] }],
      metric: "uniques", countGroup: "User",
      groupBy: [{ type: "user", value: "gp:agencyId", group_type: "User" }],
      segments: makeSegments(),
    },
    groupByLimit: 20, timeSeriesLimit: 20,
  };
  try {
    const res = await fetch("https://amplitude.com/api/2/query", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return {};
    const data = await res.json();
    const result: Record<string, number[]> = {};
    (data.data?.seriesLabels || []).forEach((label: string, i: number) => {
      result[label] = (data.data?.series?.[i] || []).map((v: number | null) => v ?? 0);
    });
    return result;
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
  // Queries A and B run sequentially (parallel causes Amplitude timeout)
  const weeklyReg = await queryAmplitude("registration_partner_id_update", 7, "Last 3 Weeks");
  const weeklyWAU = await queryAmplitude("server_credit_buy", 7, "Last 3 Weeks");
  const dailyReg = await queryAmplitude("registration_partner_id_update", 1, "Last 8 Days");
  const dailyDAU = await queryAmplitude("server_credit_buy", 1, "Last 8 Days");

  return AGENCY_IDS.map(id => {
    const wSeries = weeklyWAU[id] || [];
    const rSeries = weeklyReg[id] || [];
    const drSeries = dailyReg[id] || [];
    const ddSeries = dailyDAU[id] || [];

    // Weekly: 4 buckets, index 3=current week, index 2=prev week
    const wauCurrent = wSeries[3] ?? 0;
    const wauPrev = wSeries[2] ?? 0;
    const regCurrent = rSeries[3] ?? 0;
    const regPrev = rSeries[2] ?? 0;

    // Daily: 8 buckets, index 7=yesterday, index 0=same weekday -7
    const dauYesterday = ddSeries[7] ?? 0;
    const dauPrev7d = ddSeries[0] ?? 0;
    const regYesterday = drSeries[7] ?? 0;
    const regPrev7d = drSeries[0] ?? 0;

    const healthScore = computeHealth(regYesterday, regPrev7d, dauYesterday, dauPrev7d);
    return { agencyId: id, wauCurrent, wauPrev, regCurrent, regPrev, dauYesterday, dauPrev7d, regYesterday, regPrev7d, healthScore };
  });
}

// Legacy — used by old agent summary feature
export async function getAgentMetrics(): Promise<AgentMetric[]> {
  const metrics = await getAgencyMetrics();
  return metrics.map(m => ({ name: m.agencyId, current: m.wauCurrent, prev: m.wauPrev }));
}
