import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Email і пароль обов'язкові" }, { status: 400 });
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email вже зареєстровано" }, { status: 400 });
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, name, password: hashed } });
  return NextResponse.json({ id: user.id, email: user.email });
}
