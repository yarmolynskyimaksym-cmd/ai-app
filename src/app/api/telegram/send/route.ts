import { auth } from "@/lib/auth";
import { sendDocument } from "@/lib/adapters/telegram";
import { NextRequest, NextResponse } from "next/server";

// Ручне завантаження файлу → відправка в Telegram-групу через бота
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const chatId = form.get("chatId") as string;
  const caption = (form.get("caption") as string) || "";

  if (!file || file.size === 0) return NextResponse.json({ error: "Файл не вибрано" }, { status: 400 });
  if (!chatId) return NextResponse.json({ error: "Групу не вибрано" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const res = await sendDocument(chatId, buffer, file.name, caption);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 502 });
  return NextResponse.json({ ok: true, fileName: file.name });
}
