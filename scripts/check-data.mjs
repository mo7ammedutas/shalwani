import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const products = await prisma.product.findMany({ select: { id: true, nameEn: true, nameAr: true, slug: true, createdAt: true } });
console.log("--- PRODUCTS ---");
for (const p of products) console.log(p.slug, "|", p.nameEn, "|", p.nameAr, "|", p.createdAt.toISOString());

const customers = await prisma.customer.findMany({ select: { id: true, name: true, phone: true, createdAt: true } });
console.log("\n--- CUSTOMERS ---");
for (const c of customers) console.log(c.phone, "|", c.name, "|", c.createdAt.toISOString());

const staff = await prisma.adminUser.findMany({ select: { email: true, name: true, role: true } });
console.log("\n--- STAFF ---");
for (const s of staff) console.log(s.email, "|", s.name, "|", s.role);

await prisma.$disconnect();
