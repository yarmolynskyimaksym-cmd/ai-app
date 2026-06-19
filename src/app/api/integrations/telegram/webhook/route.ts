import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Telegram шле сюди кожне нове повідомлення боту (realtime).
// Безпека: Telegram передає секрет у заголовку X-Telegram-Bot-Api-Secret-Token.

function allowlist(): string[] {
  return (process.env.TELEGRAM_ALLOWED_CONTACTS || "")
    .split(",").map(s => s.trim().replace(/^@/, "").toLowerCase()).filter(Boolean);
}

export async function POST(req: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const update = await req.json();
  const msg = update.message;
  if (!msg?.text || msg.text.startsWith("/")) return NextResponse.json({ ok: true });

  const from = msg.from || {};
  const username = (from.username || "").toLowerCase() || null;
  const allow = allowlist();
  if (allow.length && (!username || !allow.includes(username))) {
    return NextResponse.json({ ok: true }); // не дозволений контакт — ігноруємо
  }

  // Командний центр — один користувач (перший в базі)
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) return NextResponse.json({ ok: true });

  const fullName = [from.first_name, from.last_name].filter(Boolean).join(" ") || from.username || "Невідомий";
  const externalId = `tg_${msg.message_id}_${msg.chat?.id ?? ""}`;

  const exists = await prisma.message.findUnique({ where: { externalId } });
  if (!exists) {
    await prisma.message.create({
      data: {
        externalId,
        channel: "telegram",
        author: fullName,
        text: msg.text,
        receivedAt: new Date((msg.date ?? 0) * 1000),
        userId: user.id,
      },
    });
  }
  return NextResponse.json({ ok: true });
}
