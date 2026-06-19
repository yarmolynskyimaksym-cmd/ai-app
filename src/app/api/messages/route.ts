import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const messages = await prisma.message.findMany({
    where: { userId: session.user.id as string },
    orderBy: { receivedAt: "desc" },
  });
  return NextResponse.json({ messages });
}
