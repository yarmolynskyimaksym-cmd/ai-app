import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askClaudeJSON } from "@/lib/ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id as string;
  const { text } = await req.json();
  const today = new Date().toISOString().slice(0,10);
  
  const data = await askClaudeJSON<{ action: string; dueDate?: string }>(
    `Розбери цю нотатку: "${text}". Визнач action (що саме зробити) і dueDate (дата виконання ISO, сьогодні=${today}). 
Поверни JSON: {"action":"...","dueDate":"2026-06-19"} або без dueDate якщо не вказано.`
  );

  const note = await prisma.note.create({ data: { raw: text, action: data.action, dueDate: data.dueDate ? new Date(data.dueDate) : null, userId } });
  return NextResponse.json({ note });
}
