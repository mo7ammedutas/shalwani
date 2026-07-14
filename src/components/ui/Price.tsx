import { formatOmr } from "@/lib/money";
import type { Locale } from "@/lib/i18n/config";

export function Price({
  baisa,
  locale,
  className = "",
}: {
  baisa: number;
  locale: Locale;
  className?: string;
}) {
  return (
    <span className={`tabular ${className}`} dir="ltr" style={{ unicodeBidi: "embed" }}>
      {formatOmr(baisa, locale)}
    </span>
  );
}
