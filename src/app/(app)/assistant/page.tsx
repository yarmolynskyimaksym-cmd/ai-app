import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AssistantClient } from "./AssistantClient";

export default async function AssistantPage() {
  const session = await auth(); if (!session?.user?.id) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const notes = await prisma.note.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });
  const todayNotes = notes.filter(n => !n.done && n.dueDate && new Date(n.dueDate) <= new Date());
  return <AssistantClient notes={notes} todayNotes={todayNotes} />;
}
