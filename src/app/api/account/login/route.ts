import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPasswordHash } from "@/lib/password";
import { createCustomerSessionToken, CUSTOMER_COOKIE } from "@/lib/customer-auth";

const schema = z.object({
  phone: z.string().trim().min(7).max(20),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  let input: z.infer<typeof schema>;
  try {
    input = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { phone: input.phone } });
  if (!customer?.passwordHash || !verifyPasswordHash(input.password, customer.passwordHash)) {
    await new Promise((r) => setTimeout(r, 500)); // blunt brute-force guessing
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CUSTOMER_COOKIE, createCustomerSessionToken(customer.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 24 * 3600,
  });
  return response;
}
