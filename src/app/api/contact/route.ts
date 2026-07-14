import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(20),
  message: z.string().trim().min(2).max(2000),
});

export async function POST(request: Request) {
  try {
    const input = contactSchema.parse(await request.json());
    await prisma.contactMessage.create({ data: input });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
}
