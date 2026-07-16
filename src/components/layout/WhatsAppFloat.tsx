import { SOCIAL } from "@/lib/i18n/config";
import { IconWhatsApp } from "@/components/ui/icons";

/** Floating support button — support channel only, never a sales channel. */
export function WhatsAppFloat({ label, href = SOCIAL.whatsapp }: { label: string; href?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="print:hidden fixed bottom-6 end-6 z-40 flex size-13 items-center justify-center rounded-full bg-bg border border-surface-muted text-accent-light shadow-[0_6px_20px_rgba(14,20,36,0.18)] hover:border-accent-light hover:-translate-y-0.5"
    >
      <IconWhatsApp className="size-6" />
    </a>
  );
}
