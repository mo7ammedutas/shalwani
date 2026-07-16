/**
 * Runs `prisma migrate deploy` for the production build.
 * - Prefers DATABASE_URL_UNPOOLED (Neon's direct connection) — migrations
 *   through the pooler can hit P1002 timeouts while the compute wakes.
 * - Retries twice, since the first connection may still land on a cold start.
 */
import { execSync } from "node:child_process";

const direct = process.env.DATABASE_URL_UNPOOLED;
const env = direct ? { ...process.env, DATABASE_URL: direct } : process.env;

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
