import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AnalyticsClient } from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const session = await auth(); if (!session?.user?.id) return null;
  const templates = await prisma.promptTemplate.findMany({ where: { userId: session!.user.id }, orderBy: { createdAt: "desc" } });
  const history = await prisma.analyticsUpdate.findMany({ where: { userId: session!.user.id }, orderBy: { createdAt: "desc" }, take: 20 });
  return <AnalyticsClient templates={templates} history={history} />;
}
