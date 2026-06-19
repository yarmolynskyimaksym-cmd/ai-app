import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AnalyticsClient } from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const session = await auth(); if (!session?.user?.id) return null;
  const groups = await prisma.telegramChat.findMany({ orderBy: { updatedAt: "desc" } });
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" }, take: 20,
    select: { id: true, type: true, status: true, chatTitle: true, resultFileName: true, error: true, createdAt: true },
  });
  return <AnalyticsClient groups={groups} initialJobs={jobs} />;
}
