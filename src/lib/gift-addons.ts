import "server-only";
import { prisma } from "@/lib/db";

export async function getActiveGiftAddons() {
  return prisma.giftAddon.findMany({
    where: { active: true },
    orderBy: { priceBaisa: "asc" },
  });
}
