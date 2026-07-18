import type { Metadata } from "next";
import { isLocale, SOCIAL, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContactForm } from "@/components/sections/ContactForm";
import { IconInstagram, IconWhatsApp } from "@/components/ui/icons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : "ar");
  return { title: dict.contact.title, description: dict.contact.intro };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const dict = getDictionary(locale);
  const t = dict.contact;

  const channels = [
    {
      href: SOCIAL.instagram,
      icon: <IconInstagram className="size-5" />,
      title: t.instagramTitle,
      body: t.instagramBody,
      handle: "@shalwani.om",
    },
    {
      href: SOCIAL.whatsapp,
      icon: <IconWhatsApp className="size-5" />,
      title: t.whatsappTitle,
      body: t.whatsappBody,
      handle: "wa.me",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 pt-10 pb-20 flex flex-col gap-16">
      <header className="max-w-2xl flex flex-col gap-6">
        <SectionHeading as="h1" eyebrow={dict.nav.contact} title={t.title} />
        <p className="text-text-dim leading-loose">{t.intro}</p>
      </header>

      {/* Shop info — phone, address, hours (matches the real @shalwani.om bio) */}
      <section
        data-testid="shop-info"
        className="border border-surface-muted bg-surface/40 px-6 py-8 md:px-8 flex flex-col gap-6"
      >
        <h2 className="font-heading text-xl text-text">{t.infoTitle}</h2>
        <dl className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <dt className="type-label text-text-dim">{t.phoneLabel}</dt>
            <dd>
              <a
                href={`tel:${t.phoneValue.replace(/\s+/g, "")}`}
                dir="ltr"
                className="tabular text-lg text-accent-light hover:underline underline-offset-4"
                data-testid="shop-phone"
              >
                {t.phoneValue}
              </a>
            </dd>
          </div>
          <div className="flex flex-col gap-1.5">
            <dt className="type-label text-text-dim">{t.addressLabel}</dt>
            <dd className="flex flex-col gap-1">
              <span className="text-text leading-relaxed">{t.addressValue}</span>
              <a
                href="https://www.google.com/maps/search/?api=1&query=AALIA+Hotel+Suites+Sohar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent-light underline underline-offset-4 self-start"
              >
                {t.addressMapCta}
              </a>
            </dd>
          </div>
          <div className="flex flex-col gap-1.5">
            <dt className="type-label text-text-dim">{t.hoursLabel}</dt>
            <dd className="text-text leading-relaxed">{t.hoursValue}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-12 lg:grid-cols-2 items-start">
        <div className="flex flex-col hairline-t">
          {channels.map((c) => (
            <a
              key={c.href}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-5 py-8 hairline-b hover:bg-surface/50 transition-colors duration-[var(--duration-calm)] px-2 -mx-2"
            >
              <span className="mt-1 text-accent-light">{c.icon}</span>
              <span className="flex flex-col gap-1.5">
                <span className="font-heading text-lg text-text group-hover:text-accent-light">
                  {c.title}
                </span>
                <span className="text-sm text-text-dim leading-relaxed">{c.body}</span>
                <span lang="en" dir="ltr" className="text-sm text-accent-light self-start">
                  {c.handle}
                </span>
              </span>
            </a>
          ))}
        </div>

        <ContactForm dict={dict} />
      </div>
    </div>
  );
}
