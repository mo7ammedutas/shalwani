import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Names used exclusively by the e2e suite — safe to purge with all records.
const TEST_NAMES = ["عميل الكوبون", "عميل الشحن", "عميل التقييم", "عميل CRM", "عميل للحذف", "عميل الاختبار", "عميل الطلبات", "سالم الهنائي", "Salim Al Hinai", "عميل حذف تجريبي", "سالم بن سعيد الهنائي"];

const customers = await prisma.customer.findMany({ where: { name: { in: TEST_NAMES } } });
for (const c of customers) {
  const orders = await prisma.order.findMany({ where: { customerId: c.id }, select: { id: true } });
  const orderIds = orders.map((o) => o.id);
  await prisma.$transaction([
    prisma.orderGiftAddon.deleteMany({ where: { orderId: { in: orderIds } } }),
    prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } }),
    prisma.paymentTransaction.deleteMany({ where: { orderId: { in: orderIds } } }),
    prisma.order.deleteMany({ where: { id: { in: orderIds } } }),
    prisma.wishlistItem.deleteMany({ where: { customerId: c.id } }),
    prisma.review.deleteMany({ where: { customerId: c.id } }),
    prisma.loyaltyTransaction.deleteMany({ where: { customerId: c.id } }),
    prisma.customer.delete({ where: { id: c.id } }),
  ]);
  console.log("purged:", c.name, c.phone);
}

// Stray e2e coupons (E2E prefix) and the interactive TESTCODE9.
const coupons = await prisma.coupon.deleteMany({
  where: { OR: [{ code: { startsWith: "E2E" } }, { code: "TESTCODE9" }] },
});
console.log("coupons purged:", coupons.count);
await prisma.$disconnect();
