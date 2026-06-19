import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BugsClient } from "./BugsClient";

export default async function BugsPage() {
  const session = await auth(); if (!session?.user?.id) return null;
  const bugs = await prisma.bug.findMany({ where: { userId: session!.user.id }, orderBy: { createdAt: "desc" } });
  return <BugsClient bugs={bugs} />;
}
