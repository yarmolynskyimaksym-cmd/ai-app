import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await auth();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const update = await prisma.analyticsUpdate.findUnique({ where: { id } });
  if (!update) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (update.format === "csv") {
    return new NextResponse(update.result, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="update.csv"` },
    });
  }
  return new NextResponse(update.result, {
    headers: { "Content-Type": "text/markdown", "Content-Disposition": `attachment; filename="update.md"` },
  });
}
