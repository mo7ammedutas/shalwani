import { execSync } from "node:child_process";

/** Reseed the catalogue before every run: paid test orders decrement real
 * stock, so without this the suite slowly sells itself out. The seed is an
 * upsert — it restores canonical prices/stock without touching orders. */
export default function globalSetup() {
  execSync("npx prisma db seed", { stdio: "inherit" });
}
