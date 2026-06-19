import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SocialClient } from "./SocialClient";

export default async function SocialPage() {
  const session = await auth(); if (!session?.user?.id) return null;
  const posts = await prisma.post.findMany({ where: { userId: session!.user.id }, orderBy: { id: "desc" }, take: 20 });
  return <SocialClient posts={posts} />;
}
