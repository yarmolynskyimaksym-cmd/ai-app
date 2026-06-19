import { auth } from "@/lib/auth";
import { askClaudeJSON } from "@/lib/ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await auth();
  const { prompt, mediaType, accountLabel, lang, platform } = await req.json();

  const langNote = lang ? `Мова підпису: ${lang}.` : "";
  const mediaNote = mediaType ? `Тип медіа: ${mediaType}.` : "";
  const platformNote = platform ? `Платформа: ${platform}.` : "";

  const data = await askClaudeJSON<{ variants: string[] }>(
    `Ти — SMM-копірайтер. Створи 2 варіанти підпису для посту в соцмережах.
Акаунт: ${accountLabel || "невідомий"}. ${platformNote} ${mediaNote}
Ідея від автора: "${prompt}"
${langNote}
ВАЖЛИВО: Пиши підписи ТІЛЬКИ мовою "${lang || "українська"}". Додай відповідні хештеги тією ж мовою.
Поверни JSON: {"variants":["варіант 1","варіант 2"]}`
  );
  return NextResponse.json(data);
}
