import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askClaudeJSON } from "@/lib/ai";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const messages = await prisma.message.findMany({ where: { userId: session.user.id }, orderBy: { receivedAt: "desc" } });
  const list = messages.map((m, i) => `${i + 1}. [${m.channel}] ${m.author}: ${m.text}`).join("\n");
  
  const data = await askClaudeJSON<{ classifications: Array<{ index: number; severity: string; category: string; isQuestion: boolean }>; summary: string; questions: string[] }>(
    `Проаналізуй ці повідомлення від агентів. Для кожного визнач severity (critical/high/normal/low), category (finance/technical/complaint/question/other), isQuestion (true/false).
Також напиши вижимку дня (summary) і список прямих питань до менеджера (questions).
Повідомлення:\n${list}\n
Поверни строгий JSON:
{"classifications":[{"index":1,"severity":"...","category":"...","isQuestion":false}...],"summary":"...","questions":["..."]}`
  );

  const updated = await Promise.all(messages.map(async (m, i) => {
    const c = data.classifications.find(c => c.index === i + 1);
    if (!c) return m;
    return prisma.message.update({ where: { id: m.id }, data: { severity: c.severity, category: c.category, isQuestion: c.isQuestion } });
  }));

  return NextResponse.json({ messages: updated, summary: data.summary, questions: data.questions });
}
