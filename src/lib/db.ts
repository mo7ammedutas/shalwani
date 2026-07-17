import { Prisma, PrismaClient } from "@prisma/client";

/** Neon (serverless Postgres) drops idle pooled connections while waking
 * from scale-to-zero, surfacing as P1001/P1002/P1017 mid-query. One
 * transparent retry after a short pause absorbs nearly all of them —
 * without it, a checkout or admin action dies on a transient blip. */
const RETRYABLE = new Set(["P1001", "P1002", "P1017"]);

function isRetryable(err: unknown): boolean {
  return (
    (err instanceof Prisma.PrismaClientKnownRequestError && RETRYABLE.has(err.code)) ||
    err instanceof Prisma.PrismaClientRustPanicError
  );
}

function buildClient() {
  return new PrismaClient().$extends({
    query: {
      async $allOperations({ args, query }) {
        try {
          return await query(args);
        } catch (err) {
          if (!isRetryable(err)) throw err;
          await new Promise((r) => setTimeout(r, 500));
          return query(args);
        }
      },
    },
  });
}

type ExtendedClient = ReturnType<typeof buildClient>;

const globalForPrisma = globalThis as unknown as { prisma?: ExtendedClient };

export const prisma = globalForPrisma.prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
