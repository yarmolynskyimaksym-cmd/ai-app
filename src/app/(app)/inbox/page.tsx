import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { InboxClient } from "./InboxClient";

export default async function InboxPage() {
  const session = await auth(); if (!session?.user?.id) return null;
  const messages = await prisma.message.findMany({
    where: { userId: session!.user.id },
    orderBy: { receivedAt: "desc" },
  });
  return <InboxClient messages={messages} />;
}
