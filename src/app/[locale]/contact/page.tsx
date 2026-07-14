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
    <div className="mx-auto max-w-6xl px-5 md:px-8 pt-32 pb-24 flex flex-col gap-16">
      <header className="max-w-2xl flex flex-col gap-6">
        <SectionHeading as="h1" eyebrow={dict.nav.contact} title={t.title} />
        <p className="text-text-dim leading-loose">{t.intro}</p>
      </header>

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
