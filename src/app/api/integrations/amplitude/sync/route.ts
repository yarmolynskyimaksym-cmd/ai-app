import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAgentMetrics } from "@/lib/adapters/amplitude";
import { NextResponse } from "next/server";

export async function POST() {
  await auth();
  const metrics = await getAgentMetrics();
  for (const m of metrics) {
    const existing = await prisma.agent.findFirst({ where: { name: m.name } });
    if (existing) {
      await prisma.agent.update({ where: { id: existing.id }, data: { metricCurrent: m.current, metricPrev: m.prev } });
    } else {
      await prisma.agent.create({ data: { name: m.name, metricCurrent: m.current, metricPrev: m.prev, period: new Date().toISOString().slice(0,10) } });
    }
  }
  return NextResponse.json({ ok: true, count: metrics.length });
}
