import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Локальний worker опитує цей ендпоінт. Захист — заголовок x-worker-secret.
export async function GET(req: NextRequest) {
  const secret = process.env.WORKER_SECRET;
  if (!secret || req.headers.get("x-worker-secret") !== secret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const job = await prisma.job.findFirst({ where: { status: "pending" }, orderBy: { createdAt: "asc" } });
  if (!job) return NextResponse.json({ job: null });
  await prisma.job.update({ where: { id: job.id }, data: { status: "running" } });
  return NextResponse.json({ job: { id: job.id, type: job.type, prompt: job.prompt, params: job.params } });
}
