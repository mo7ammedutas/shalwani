import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
await prisma.adminUser.update({ where: { email: "owner@shalwani.om" }, data: { totpSecret: null } });
console.log("owner totpSecret cleared");
await prisma.$disconnect();
