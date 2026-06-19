import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAgentMetrics } from "@/lib/adapters/amplitude";
import { NextResponse } from "next/server";

export async function POST() {
  await auth();
  const metrics = await getAgentMetrics();
  for (const m of metrics) {
    await prisma.agent.upsert({
      where: { id: m.name }, // using name as fallback key
      update: { metricCurrent: m.current, metricPrev: m.prev },
      create: { name: m.name, metricCurrent: m.current, metricPrev: m.prev, period: new Date().toISOString().slice(0,10) },
    }).catch(() => prisma.agent.updateMany({ where: { name: m.name }, data: { metricCurrent: m.current, metricPrev: m.prev } }));
  }
  return NextResponse.json({ ok: true, count: metrics.length });
}
