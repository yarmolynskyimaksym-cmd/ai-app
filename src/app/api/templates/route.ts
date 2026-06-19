import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id as string;
  const { name, description, promptText, outputFormat } = await req.json();
  const template = await prisma.promptTemplate.create({ data: { name, description, promptText, outputFormat: outputFormat || "markdown", userId } });
  return NextResponse.json({ template });
}
