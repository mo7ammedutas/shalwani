import { NextResponse } from "next/server";
import { verifyOrderPayment } from "@/lib/orders";

/** Server-side payment verification — queried by the success page and
 * usable for client polling. Never trusts the browser redirect. */
export async function GET(request: Request) {
  const orderNumber = new URL(request.url).searchParams.get("order");
  if (!orderNumber || !/^SHW-[A-Z0-9]{4,16}$/.test(orderNumber)) {
    return NextResponse.json({ error: "invalid_order" }, { status: 400 });
  }
  const result = await verifyOrderPayment(orderNumber);
  if (result.status === "not_found") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
