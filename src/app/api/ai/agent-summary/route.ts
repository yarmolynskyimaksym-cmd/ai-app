import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askClaude } from "@/lib/ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await auth();
  const { agentId } = await req.json();
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const delta = agent.metricPrev > 0 ? ((agent.metricCurrent - agent.metricPrev) / agent.metricPrev * 100).toFixed(1) : "0";
  const summary = await askClaude(
    `Агент: ${agent.name}. Поточна метрика: ${agent.metricCurrent}, минула: ${agent.metricPrev}, зміна: ${delta}%. Напиши 1-2 речення аналізу що змінилось і що варто перевірити. Відповідь тільки текстом, без заголовків.`
  );
  await prisma.agent.update({ where: { id: agentId }, data: { aiSummary: summary } });
  return NextResponse.json({ summary });
}
