import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

/**
 * Locale routing: every page lives under /ar (default) or /en.
 * - Locale-prefixed requests pass through, carrying an `x-locale` request
 *   header that the root layout reads to set <html lang/dir>.
 * - Requests without a locale prefix are redirected, honouring the
 *   NEXT_LOCALE cookie set by the language switcher.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const first = pathname.split("/")[1];
  if (isLocale(first)) {
    const headers = new Headers(request.headers);
    headers.set("x-locale", first);
    return NextResponse.next({ request: { headers } });
  }

  const cookie = request.cookies.get("NEXT_LOCALE")?.value;
  const locale = cookie && isLocale(cookie) ? cookie : defaultLocale;

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip API routes, Next internals and any file with an extension.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
