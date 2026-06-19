import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job?.resultData || !job.resultFileName) return NextResponse.json({ error: "not ready" }, { status: 404 });
  const buffer = Buffer.from(job.resultData, "base64");
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${job.resultFileName}"`,
    },
  });
}
