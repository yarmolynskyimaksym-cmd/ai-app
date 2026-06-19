import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTelegramMessages } from "@/lib/adapters/telegram";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id as string;
  const tgMessages = await getTelegramMessages();
  const saved = [];
  for (const m of tgMessages) {
    const exists = m.id ? await prisma.message.findUnique({ where: { externalId: m.id } }) : null;
    if (exists) continue;
    const msg = await prisma.message.create({ data: { externalId: m.id, channel: "telegram", author: m.author, text: m.text, receivedAt: new Date(m.date), userId } });
    saved.push(msg);
  }
  const all = await prisma.message.findMany({ where: { userId }, orderBy: { receivedAt: "desc" } });
  return NextResponse.json({ messages: all, synced: saved.length });
}
