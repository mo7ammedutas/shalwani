import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/customer-auth";

const schema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(4).max(2000),
});

/** Submit a product review. Requires a signed-in customer with a paid order
 * containing the product ("verified buyer") — reviews land unapproved and
 * only render publicly after moderation. */
export async function POST(request: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  let input: z.infer<typeof schema>;
  try {
    input = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId: input.productId,
      order: {
        customerId: customer.id,
        status: { in: ["paid", "shipped", "delivered"] },
      },
    },
    select: { id: true },
  });
  if (!purchased) {
    return NextResponse.json({ error: "purchase_required" }, { status: 403 });
  }

  const existing = await prisma.review.findUnique({
    where: { productId_customerId: { productId: input.productId, customerId: customer.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "already_reviewed" }, { status: 409 });
  }

  await prisma.review.create({
    data: {
      productId: input.productId,
      customerId: customer.id,
      rating: input.rating,
      text: input.text,
    },
  });

  return NextResponse.json({ ok: true });
}
