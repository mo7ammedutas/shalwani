import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app is nested inside a folder that has its own lockfile; pin the
  // workspace root so Turbopack resolves from here.
  turbopack: { root: __dirname },
  images: {
    // Placeholder art is SVG until real photography lands (README §Content).
    // Served with a sandboxing CSP so SVG can't execute anything.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Merchant-uploaded product images live in Vercel Blob.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
