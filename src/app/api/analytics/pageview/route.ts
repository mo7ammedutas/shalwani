import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Increments today's storefront visit counter. No PII, no cookies — a
 * single daily total, good enough for an approximate conversion metric. */
export async function POST() {
  const day = new Date().toISOString().slice(0, 10);
  await prisma.pageView.upsert({
    where: { day },
    update: { count: { increment: 1 } },
    create: { day, count: 1 },
  });
  return NextResponse.json({ ok: true });
}
