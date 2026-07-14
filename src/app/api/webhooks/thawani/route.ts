import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyOrderPayment } from "@/lib/orders";

/**
 * Thawani webhook endpoint (configure the URL in the Thawani dashboard).
 *
 * We deliberately do NOT trust the webhook payload for the payment result:
 * the payload only tells us which session/order to re-check, and the actual
 * status is confirmed server-to-server via the Thawani sessions API inside
 * verifyOrderPayment(). Every delivery is stored in PaymentTransaction for
 * auditing.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const data = (body?.data ?? body) as Record<string, unknown>;
  const sessionId =
    typeof data?.session_id === "string"
      ? data.session_id
      : typeof body?.session_id === "string"
        ? (body.session_id as string)
        : null;
  const clientRef =
    typeof data?.client_reference_id === "string" ? (data.client_reference_id as string) : null;

  const order = sessionId
    ? await prisma.order.findUnique({ where: { thawaniSessionId: sessionId } })
    : clientRef
      ? await prisma.order.findUnique({ where: { orderNumber: clientRef } })
      : null;

  if (!order) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  await prisma.paymentTransaction.create({
    data: {
      orderId: order.id,
      sessionId: order.thawaniSessionId ?? "unknown",
      status: "webhook_received",
      rawPayload: JSON.stringify(payload),
    },
  });

  const result = await verifyOrderPayment(order.orderNumber);
  return NextResponse.json({ received: true, status: result.status });
}
