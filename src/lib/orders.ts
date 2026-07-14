import "server-only";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/thawani";

export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export function newOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
  return `SHW-${stamp}${rand}`;
}

/**
 * Confirm an order's payment against Thawani's API directly (never trusting
 * the browser redirect alone). Idempotent: an already-paid order returns
 * immediately, and stock is decremented exactly once.
 */
export async function verifyOrderPayment(orderNumber: string): Promise<{
  status: OrderStatus | "not_found";
  orderNumber: string;
}> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) return { status: "not_found", orderNumber };
  if (order.status === "paid") return { status: "paid", orderNumber };
  if (!order.thawaniSessionId) return { status: order.status as OrderStatus, orderNumber };

  let paymentStatus: string;
  let rawPayload: string;
  try {
    const session = await getSession(order.thawaniSessionId);
    paymentStatus = session.payment_status;
    rawPayload = JSON.stringify(session);
  } catch (err) {
    // Couldn't reach Thawani — leave the order pending; webhook or a later
    // verify call will settle it.
    await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        sessionId: order.thawaniSessionId,
        status: "verify_error",
        rawPayload: JSON.stringify({ error: String(err) }),
      },
    });
    return { status: order.status as OrderStatus, orderNumber };
  }

  if (paymentStatus === "paid") {
    await prisma.$transaction([
      prisma.order.updateMany({
        where: { id: order.id, status: { not: "paid" } },
        data: { status: "paid" },
      }),
      ...order.items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        }),
      ),
      prisma.paymentTransaction.create({
        data: {
          orderId: order.id,
          sessionId: order.thawaniSessionId,
          status: "paid",
          rawPayload,
        },
      }),
    ]);
    return { status: "paid", orderNumber };
  }

  if (paymentStatus === "cancelled" || paymentStatus === "canceled") {
    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { status: "cancelled" } }),
      prisma.paymentTransaction.create({
        data: {
          orderId: order.id,
          sessionId: order.thawaniSessionId,
          status: "cancelled",
          rawPayload,
        },
      }),
    ]);
    return { status: "cancelled", orderNumber };
  }

  // unpaid / anything else — record the check, keep pending
  await prisma.paymentTransaction.create({
    data: {
      orderId: order.id,
      sessionId: order.thawaniSessionId,
      status: `checked_${paymentStatus}`,
      rawPayload,
    },
  });
  return { status: order.status as OrderStatus, orderNumber };
}
