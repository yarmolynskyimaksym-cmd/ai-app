import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Список груп/чатів, де присутній бот (захоплюються webhook-ом)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const chats = await prisma.telegramChat.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ chats });
}
