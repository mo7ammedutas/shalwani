import { headers } from "next/headers";
import { Cairo, Poppins } from "next/font/google";
import "./globals.css";
import { defaultLocale, dirFor, isLocale, type Locale } from "@/lib/i18n/config";

/* Two-family type system matching the reference theme's Poppins/Gotham
   register: Cairo carries Arabic, Poppins carries Latin. globals.css
   picks the stack from the page language. */
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

const fontVariables = `${cairo.variable} ${poppins.variable}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The proxy stamps every locale-prefixed request with x-locale.
  const headerLocale = (await headers()).get("x-locale");
  const locale: Locale =
    headerLocale && isLocale(headerLocale) ? headerLocale : defaultLocale;

  return (
    <html lang={locale} dir={dirFor(locale)} className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
