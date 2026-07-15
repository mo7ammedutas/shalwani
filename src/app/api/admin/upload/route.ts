import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isAdmin } from "@/lib/admin-auth";

const ALLOWED = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/avif", ".avif"],
]);
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Product image upload.
 * - With BLOB_READ_WRITE_TOKEN (Vercel/production): stored in Vercel Blob,
 *   returns a permanent public CDN URL.
 * - Without it (local development): written to public/uploads/.
 */
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const base =
    (file.name.split(/[\\/]/).pop() ?? "image")
      .replace(/\.[^.]*$/, "")
      .replace(/[^\w-]+/g, "-")
      .slice(0, 40)
      .replace(/^-+|-+$/g, "") || "image";
  const name = `${Date.now().toString(36)}-${base}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`products/${name}`, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });
    return NextResponse.json({ path: blob.url });
  }

  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ path: `/uploads/${name}` });
}
