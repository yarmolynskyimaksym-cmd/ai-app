import { auth } from "@/lib/auth";
import { askClaudeJSON } from "@/lib/ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await auth();
  const { prompt } = await req.json();
  const data = await askClaudeJSON<{ variants: string[] }>(
    `Створи 2 варіанти поста для соцмереж за темою: "${prompt}". Кожен варіант — повний текст з хештегами. Пиши українською.
Поверни JSON: {"variants":["варіант 1","варіант 2"]}`
  );
  return NextResponse.json(data);
}
