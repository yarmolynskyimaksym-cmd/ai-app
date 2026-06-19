import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  await auth();
  const agents = await prisma.agent.findMany({ orderBy: { metricCurrent: "desc" } });
  return <DashboardClient agents={agents} />;
}
