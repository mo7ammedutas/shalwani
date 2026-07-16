import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPasswordHash } from "@/lib/password";
import { ADMIN_COOKIE, createSessionToken } from "@/lib/admin-auth";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  let input: z.infer<typeof schema>;
  try {
    input = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const user = await prisma.adminUser.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user || !user.active || !verifyPasswordHash(input.password, user.passwordHash)) {
    // Small fixed delay to blunt brute-force guessing
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 3600,
  });
  return response;
}
