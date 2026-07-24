import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signSession, SESSION_COOKIE } from "@/lib/session";

interface UserRow { id: string; email: string; password_hash: string; role: string; }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json({ error: "Enter an email and password." }, { status: 400 });
  }

  const user = db.prepare("SELECT id, email, password_hash, role FROM users WHERE email = ?").get(email) as UserRow | undefined;

  // Same error for "no such user" and "wrong password" — never confirm which one it was.
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return NextResponse.json({ error: "That email or password isn't right." }, { status: 401 });
  }

  const token = await signSession({ userId: user.id, email: user.email, role: user.role });
  const res = NextResponse.json({ email: user.email, role: user.role });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
