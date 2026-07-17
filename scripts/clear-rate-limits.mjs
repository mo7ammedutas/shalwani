import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const res = await prisma.rateLimit.deleteMany({});
console.log("rate-limit rows cleared:", res.count);
await prisma.$disconnect();
