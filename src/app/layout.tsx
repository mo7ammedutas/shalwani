import { headers } from "next/headers";
import {
  Amiri,
  Lora,
  Marcellus,
  Markazi_Text,
  Playfair_Display,
  Reem_Kufi,
} from "next/font/google";
import "./globals.css";
import { defaultLocale, dirFor, isLocale, type Locale } from "@/lib/i18n/config";

/* Six-family type system: display / heading / body, per script.
   globals.css picks the right stack from the page language. */
const reemKufi = Reem_Kufi({
  subsets: ["arabic", "latin"],
  variable: "--font-reem-kufi",
  display: "swap",
});
const marcellus = Marcellus({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-marcellus",
  display: "swap",
});
const amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-amiri",
  display: "swap",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});
const markazi = Markazi_Text({
  subsets: ["arabic", "latin"],
  variable: "--font-markazi",
  display: "swap",
});
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });

const fontVariables = [reemKufi, marcellus, amiri, playfair, markazi, lora]
  .map((f) => f.variable)
  .join(" ");

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
