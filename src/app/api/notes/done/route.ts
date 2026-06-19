import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await auth();
  const { id } = await req.json();
  const note = await prisma.note.update({ where: { id }, data: { done: true } });
  return NextResponse.json(note);
}
