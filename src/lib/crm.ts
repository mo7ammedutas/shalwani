import "server-only";
import { prisma } from "@/lib/db";

/** A customer counts as VIP once their lifetime paid spend crosses this
 * threshold. Computed on read rather than stored, so it never goes stale. */
export const VIP_THRESHOLD_BAISA = 200_000; // 200.000 OMR

export interface CustomerStats {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  hasAccount: boolean;
  orderCount: number;
  totalSpentBaisa: number;
  lastOrderAt: Date | null;
  vip: boolean;
}

export async function getCustomersWithStats(): Promise<CustomerStats[]> {
  const customers = await prisma.customer.findMany({
    include: { orders: { where: { status: "paid" }, select: { totalBaisa: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  return customers
    .map((c) => {
      const totalSpentBaisa = c.orders.reduce((sum, o) => sum + o.totalBaisa, 0);
      const lastOrderAt = c.orders.reduce<Date | null>(
        (latest, o) => (!latest || o.createdAt > latest ? o.createdAt : latest),
        null,
      );
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        notes: c.notes,
        hasAccount: c.passwordHash != null,
        orderCount: c.orders.length,
        totalSpentBaisa,
        lastOrderAt,
        vip: totalSpentBaisa >= VIP_THRESHOLD_BAISA,
      };
    })
    .sort((a, b) => b.totalSpentBaisa - a.totalSpentBaisa);
}

export async function getCustomerDetail(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: true } } },
      },
    },
  });
  if (!customer) return null;

  const paidOrders = customer.orders.filter((o) => o.status === "paid");
  const totalSpentBaisa = paidOrders.reduce((sum, o) => sum + o.totalBaisa, 0);

  return {
    customer,
    totalSpentBaisa,
    orderCount: paidOrders.length,
    vip: totalSpentBaisa >= VIP_THRESHOLD_BAISA,
  };
}
