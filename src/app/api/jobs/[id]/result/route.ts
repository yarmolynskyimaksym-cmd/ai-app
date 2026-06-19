import { prisma } from "@/lib/prisma";
import { sendDocument } from "@/lib/adapters/telegram";
import { NextRequest, NextResponse } from "next/server";

// Worker завантажує сюди готовий файл (base64) або помилку.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const secret = process.env.WORKER_SECRET;
  if (!secret || req.headers.get("x-worker-secret") !== secret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (body.error) {
    await prisma.job.update({ where: { id }, data: { status: "error", error: String(body.error).slice(0, 1000) } });
    return NextResponse.json({ ok: true });
  }

  const { fileName, dataBase64 } = body;
  if (!fileName || !dataBase64) {
    return NextResponse.json({ error: "missing file" }, { status: 400 });
  }

  // Доставка в Telegram-групу, якщо вказана
  let deliverError: string | null = null;
  if (job.chatId) {
    const buffer = Buffer.from(dataBase64, "base64");
    const caption = `📊 ${job.type} — ${job.chatTitle || ""}`.trim();
    const res = await sendDocument(job.chatId, buffer, fileName, caption);
    if (!res.ok) deliverError = res.error || "Помилка доставки";
  }

  await prisma.job.update({
    where: { id },
    data: {
      status: deliverError ? "error" : "done",
      resultFileName: fileName,
      resultData: dataBase64,
      error: deliverError,
    },
  });
  return NextResponse.json({ ok: true, delivered: !!job.chatId && !deliverError });
}
