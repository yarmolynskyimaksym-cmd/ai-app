import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askClaudeJSON } from "@/lib/ai";
import { getSlackMessages } from "@/lib/adapters/slack";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id as string;
  const slackMessages = await getSlackMessages();
  const list = slackMessages.map((m, i) => `${i + 1}. ${m.author} (${m.channel}): ${m.text}`).join("\n");
  
  const data = await askClaudeJSON<{ bugs: Array<{ title: string; body: string; priority: string }> }>(
    `Проаналізуй ці Slack-повідомлення і витягни тільки реальні баги (відсій флуд і нетехнічні повідомлення).
Для кожного бага: title (коротко), body (деталі), priority (critical/high/medium/low).
Повідомлення:\n${list}\n
Поверни JSON: {"bugs":[{"title":"...","body":"...","priority":"..."}]}`
  );

  const bugs = await Promise.all(data.bugs.map(b =>
    prisma.bug.create({ data: { ...b, author: "Slack", channel: "#bugs", source: "slack", status: "new", userId } })
  ));
  return NextResponse.json({ bugs });
}
