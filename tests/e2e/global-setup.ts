import { execSync } from "node:child_process";

/** Reseed the catalogue before every run: paid test orders decrement real
 * stock, so without this the suite slowly sells itself out. The seed is an
 * upsert — it restores canonical prices/stock without touching orders.
 * Retries because serverless Postgres (Neon) can drop the first connection
 * while waking from scale-to-zero (P1017). */
export default function globalSetup() {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      execSync("npx prisma db seed", { stdio: "inherit" });
      return;
    } catch (err) {
      lastError = err;
      console.warn(`Seed attempt ${attempt} failed; retrying…`);
    }
  }
  throw lastError;
}
