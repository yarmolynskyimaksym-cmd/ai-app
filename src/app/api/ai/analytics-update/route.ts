import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { askClaude } from "@/lib/ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  const { templateId, inputData } = await req.json();
  const template = await prisma.promptTemplate.findUnique({ where: { id: templateId } });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
  
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await askClaude(`${template.promptText}\n\nВхідні дані:\n${inputData}`);
  const update = await prisma.analyticsUpdate.create({ data: { inputData, result, format: template.outputFormat, templateId: templateId ?? null, userId: session.user.id } });
  return NextResponse.json({ result, update });
}
