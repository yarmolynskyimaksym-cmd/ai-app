import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await auth();
  const { id, status } = await req.json();
  const bug = await prisma.bug.update({ where: { id }, data: { status } });
  return NextResponse.json(bug);
}
