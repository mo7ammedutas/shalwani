import "server-only";
import { redirect } from "next/navigation";
import { getCurrentAdmin, type CurrentAdmin } from "@/lib/admin-auth";
import { canView, canWrite, SECTION_PATH, sectionsFor, type Section, type WritePerm } from "@/lib/roles";
import { isLocale } from "@/lib/i18n/config";

function loc(locale: string): string {
  return isLocale(locale) ? locale : "ar";
}

/** Page-level guard: redirects to login if signed out, or to the first
 * section the role can actually see if it lacks access to this one. */
export async function requireSection(locale: string, section: Section): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  const l = loc(locale);
  if (!admin) redirect(`/${l}/admin/login`);
  if (!canView(admin.role, section)) {
    const fallback = sectionsFor(admin.role)[0];
    redirect(fallback ? `/${l}/admin/${SECTION_PATH[fallback]}` : `/${l}/admin/login`);
  }
  return admin;
}

/** Server-action guard: redirects to login if signed out, throws if signed
 * in but lacking the write permission — a role-appropriate UI should never
 * present a control it can't use, so reaching this branch means someone
 * bypassed the UI. */
export async function requirePerm(locale: string, perm: WritePerm): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect(`/${loc(locale)}/admin/login`);
  if (!canWrite(admin.role, perm)) {
    throw new Error(`Role "${admin.role}" lacks permission "${perm}"`);
  }
  return admin;
}
