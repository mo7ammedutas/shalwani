import { SOCIAL } from "@/lib/i18n/config";
import { IconWhatsApp } from "@/components/ui/icons";

/** Floating support button — support channel only, never a sales channel. */
export function WhatsAppFloat({ label }: { label: string }) {
  return (
    <a
      href={SOCIAL.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="fixed bottom-6 end-6 z-40 flex size-13 items-center justify-center rounded-full bg-surface border border-surface-muted text-accent-light shadow-[0_6px_24px_rgba(0,0,0,0.45)] hover:border-accent hover:text-accent-light hover:-translate-y-0.5"
    >
      <IconWhatsApp className="size-6" />
    </a>
  );
}
