import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAgencyMetrics } from "@/lib/adapters/amplitude";
import { NextResponse } from "next/server";

const AGENCY_NAMES: Record<string, string> = {
  "13425676": "Agency 13425676",
  "11205880": "Agency 11205880",
  "18477687": "Agency 18477687",
  "2093": "Agency 2093",
  "18714360": "Agency 18714360",
  "20698379": "Agency 20698379",
  "18589342": "Agency 18589342",
  "2192": "Agency 2192",
};

export async function POST() {
  await auth();
  const metrics = await getAgencyMetrics();
  for (const m of metrics) {
    const data = {
      name: AGENCY_NAMES[m.agencyId] || `Agency ${m.agencyId}`,
      agencyId: m.agencyId,
      status: "active",
      healthScore: m.healthScore,
      wauCurrent: m.wauCurrent,
      wauPrev: m.wauPrev,
      regCurrent: m.regCurrent,
      regPrev: m.regPrev,
      dauYesterday: m.dauYesterday,
      dauPrev7d: m.dauPrev7d,
      regYesterday: m.regYesterday,
      regPrev7d: m.regPrev7d,
      metricCurrent: m.wauCurrent,
      metricPrev: m.wauPrev,
      period: new Date().toISOString().slice(0, 10),
    };
    await prisma.agent.upsert({
      where: { agencyId: m.agencyId },
      update: data,
      create: data,
    });
  }
  const agents = await prisma.agent.findMany({ orderBy: { wauCurrent: "desc" } });
  return NextResponse.json({ ok: true, agents });
}
