import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadMedia, publishPost } from "@/lib/adapters/postbridge";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id as string;

  const form = await req.formData();
  const content = form.get("content") as string;
  const prompt = form.get("prompt") as string;
  const accountId = form.get("accountId") as string;
  const platform = form.get("platform") as string;
  const file = form.get("media") as File | null;

  let mediaIds: string[] | undefined;
  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const mediaId = await uploadMedia(buffer, file.type, file.name, file.size);
    mediaIds = [mediaId];
  }

  const externalId = await publishPost(content, [accountId], mediaIds);
  const post = await prisma.post.create({
    data: {
      prompt,
      content,
      network: platform || "instagram",
      status: process.env.POSTBRIDGE_API_KEY ? "published" : "draft",
      externalPostId: externalId,
      userId,
    },
  });
  return NextResponse.json({ post });
}
