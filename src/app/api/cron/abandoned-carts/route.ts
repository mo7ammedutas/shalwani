import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { abandonedCartEmail, sendEmail } from "@/lib/notify";

const ABANDON_AFTER_MS = 3 * 3600_000; // pending for 3+ hours
const MAX_AGE_MS = 3 * 24 * 3600_000; // don't nag about week-old carts
const BATCH = 25;

/**
 * Abandoned-checkout recovery. Scheduled via vercel.json crons; each run
 * finds pending orders that stalled 3–72 hours ago, sends one reminder
 * email per order, and stamps reminderSentAt so nobody is ever nagged
 * twice. Protected by CRON_SECRET (Vercel sends it as a Bearer token).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const stale = await prisma.order.findMany({
    where: {
      status: "pending",
      reminderSentAt: null,
      createdAt: {
        lte: new Date(now - ABANDON_AFTER_MS),
        gte: new Date(now - MAX_AGE_MS),
      },
    },
    include: { customer: true },
    take: BATCH,
    orderBy: { createdAt: "asc" },
  });

  let sent = 0;
  for (const order of stale) {
    // Stamp first — a duplicate email is worse than a missed one.
    await prisma.order.update({
      where: { id: order.id },
      data: { reminderSentAt: new Date() },
    });
    if (order.customer.email) {
      const mail = abandonedCartEmail({
        orderNumber: order.orderNumber,
        customerName: order.customer.name,
        totalBaisa: order.totalBaisa,
        locale: order.locale,
      });
      await sendEmail(order.customer.email, mail.subject, mail.html);
      sent += 1;
    }
  }

  return NextResponse.json({ checked: stale.length, emailed: sent });
}
