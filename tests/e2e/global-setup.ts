import { execSync } from "node:child_process";

/** Reseed the catalogue before every run: paid test orders decrement real
 * stock, so without this the suite slowly sells itself out. The seed is an
 * upsert — it restores canonical prices/stock without touching orders.
 * Retries because serverless Postgres (Neon) can drop the first connection
 * while waking from scale-to-zero (P1017).
 *
 * When TEST_DATABASE_URL is set (a dedicated Neon branch — see README),
 * both the seed and the dev server run against it instead of the shared
 * production database. Set it in .env.local to isolate test runs. */
export default function globalSetup() {
  const testDb = process.env.TEST_DATABASE_URL;
  if (testDb) {
    console.log("Using TEST_DATABASE_URL for this run (isolated test database).");
  } else {
    console.warn(
      "TEST_DATABASE_URL is not set — tests run against DATABASE_URL. " +
        "Create a Neon branch and set TEST_DATABASE_URL to isolate test data.",
    );
  }
  const env = testDb ? { ...process.env, DATABASE_URL: testDb } : process.env;

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // A fresh branch needs the schema before the seed can run.
      if (testDb) execSync("npx prisma migrate deploy", { stdio: "inherit", env });
      execSync("npx prisma db seed", { stdio: "inherit", env });
      return;
    } catch (err) {
      lastError = err;
      console.warn(`Seed attempt ${attempt} failed; retrying…`);
    }
  }
  throw lastError;
}
