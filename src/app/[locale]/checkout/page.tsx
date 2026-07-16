import type { Metadata } from "next";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { getActiveGiftAddons } from "@/lib/gift-addons";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { getSettings, vatRateFraction } from "@/lib/settings";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { SectionHeading } from "@/components/ui/SectionHeading";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : "ar");
  return { title: dict.checkout.title, robots: { index: false } };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const dict = getDictionary(locale);
  const [giftAddons, customer, settings] = await Promise.all([
    getActiveGiftAddons(),
    getCurrentCustomer(),
    getSettings(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 pt-10 pb-20 flex flex-col gap-12">
      <SectionHeading as="h1" title={dict.checkout.title} />
      <CheckoutForm
        locale={locale}
        dict={dict}
        giftAddons={giftAddons}
        customer={customer}
        gulfShippingFeeBaisa={settings.gulfShippingFeeBaisa}
        vatRate={vatRateFraction(settings)}
        vatRatePercent={settings.vatRatePercent}
      />
    </div>
  );
}
