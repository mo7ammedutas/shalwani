import { redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";

/** The bespoke page was replaced by the lookbook — keep old links alive. */
export default async function BespokeRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  redirect(`/${isLocale(raw) ? raw : "ar"}/gallery`);
}
