import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReportType } from "@/lib/reportTypes";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, type: true, status: true, chatTitle: true, resultFileName: true, error: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { typeId, params, chatId, chatTitle } = await req.json();
  const rt = getReportType(typeId);
  if (!rt) return NextResponse.json({ error: "Unknown report type" }, { status: 400 });

  const job = await prisma.job.create({
    data: {
      type: rt.id,
      params: JSON.stringify(params || {}),
      prompt: rt.buildPrompt(params || {}),
      chatId: chatId || null,
      chatTitle: chatTitle || null,
      status: "pending",
    },
    select: { id: true, type: true, status: true, chatTitle: true, createdAt: true },
  });
  return NextResponse.json({ job });
}
