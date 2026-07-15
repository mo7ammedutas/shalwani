import { NextResponse } from "next/server";
import { ADMIN_COOKIE, createSessionToken, verifyPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  let password = "";
  try {
    const body = (await request.json()) as { password?: string };
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  if (!verifyPassword(password)) {
    // Small fixed delay to blunt brute-force guessing
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "wrong_password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 3600,
  });
  return response;
}
