import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";

const schema = z.object({ productId: z.string().min(1) });

export async function POST(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const { productId } = parsed.data;

  const existing = await prisma.wishlistItem.findUnique({
    where: { customerId_productId: { customerId: customer.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return NextResponse.json({ wishlisted: false });
  }
  await prisma.wishlistItem.create({ data: { customerId: customer.id, productId } });
  return NextResponse.json({ wishlisted: true });
}
