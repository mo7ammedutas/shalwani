import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createCustomerSessionToken, CUSTOMER_COOKIE } from "@/lib/customer-auth";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().optional().or(z.literal("")),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  if (!(await checkRateLimit("register", clientIp(request)))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let input: z.infer<typeof schema>;
  try {
    input = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const existing = await prisma.customer.findUnique({ where: { phone: input.phone } });
  if (existing?.passwordHash) {
    return NextResponse.json({ error: "phone_taken" }, { status: 409 });
  }

  const passwordHash = hashPassword(input.password);
  // A guest row may already exist from a prior checkout — attach the
  // password to it instead of failing, so past guest orders become visible.
  const customer = existing
    ? await prisma.customer.update({
        where: { id: existing.id },
        data: { name: input.name, email: input.email || existing.email, passwordHash },
      })
    : await prisma.customer.create({
        data: { name: input.name, phone: input.phone, email: input.email || null, passwordHash },
      });

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
