/**
 * Runs `prisma migrate deploy` for the production build.
 * - Prefers DATABASE_URL_UNPOOLED (Neon's direct connection) — migrations
 *   through the pooler can hit P1002 timeouts while the compute wakes.
 * - Clears stale advisory locks first: a dev process killed mid-migration
 *   leaves an idle session holding Prisma's migration lock, and every
 *   later `migrate deploy` then dies with P1002 ("reached but timed out").
 * - Retries twice, since the first connection may still land on a cold start.
 */
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const direct = process.env.DATABASE_URL_UNPOOLED;
const env = direct ? { ...process.env, DATABASE_URL: direct } : process.env;

async function clearStaleAdvisoryLocks() {
  const prisma = new PrismaClient(
    direct ? { datasources: { db: { url: direct } } } : undefined,
  );
  try {
    const stale = await prisma.$queryRaw`
      SELECT DISTINCT l.pid
      FROM pg_locks l
      JOIN pg_stat_activity a ON a.pid = l.pid
      WHERE l.locktype = 'advisory'
        AND a.state = 'idle'
        AND a.pid <> pg_backend_pid()`;
    for (const row of stale) {
      await prisma.$queryRawUnsafe(
        `SELECT pg_terminate_backend(${Number(row.pid)})`,
      );
      console.warn(`Cleared stale advisory-lock session (pid ${row.pid}).`);
    }
  } catch (err) {
    // Best-effort: a failure here just means migrate deploy takes its chances.
    console.warn("Advisory-lock sweep skipped:", err?.message ?? err);
  } finally {
    await prisma.$disconnect();
  }
}

await clearStaleAdvisoryLocks();

let lastError;
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit", env });
    process.exit(0);
  } catch (err) {
    lastError = err;
    console.warn(`migrate deploy attempt ${attempt} failed; retrying…`);
  }
}
throw lastError;
