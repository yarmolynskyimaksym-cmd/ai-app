import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishPost } from "@/lib/adapters/postbridge";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id as string;
  const { content, prompt, accountId, platform } = await req.json();
  const externalId = await publishPost(content, [accountId]);
  const post = await prisma.post.create({ data: { prompt, content, network: platform || "instagram", status: process.env.POSTBRIDGE_API_KEY ? "published" : "draft", externalPostId: externalId, userId } });
  return NextResponse.json({ post });
}
