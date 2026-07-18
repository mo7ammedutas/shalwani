/** Staff role matrix. Plain constants (no server-only) so both server
 * guards and the staff-management UI can import the same source of truth. */

export const ROLES = ["admin", "manager", "support", "content", "warehouse"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export type Section =
  | "products"
  | "giftAddons"
  | "gallery"
  | "orders"
  | "customers"
  | "coupons"
  | "reviews"
  | "analytics"
  | "staff"
  | "settings";

/** Pages/nav items a role can see. */
const SECTION_ACCESS: Record<Role, Section[]> = {
  admin: ["products", "giftAddons", "gallery", "orders", "customers", "coupons", "reviews", "analytics", "staff", "settings"],
  manager: ["products", "giftAddons", "gallery", "orders", "customers", "coupons", "reviews", "analytics"],
  support: ["orders", "customers", "reviews"],
  content: ["products", "giftAddons", "gallery", "reviews"],
  warehouse: ["products", "orders"],
};

export type WritePerm =
  | "products.write"
  | "giftAddons.write"
  | "orders.write"
  | "crm.write"
  | "coupons.write"
  | "reviews.write"
  | "staff.write"
  | "settings.write";

/** Server-action write capabilities — checked in addition to, not instead
 * of, the page-level section access above. */
const WRITE_ACCESS: Record<Role, WritePerm[]> = {
  admin: ["products.write", "giftAddons.write", "orders.write", "crm.write", "coupons.write", "reviews.write", "staff.write", "settings.write"],
  manager: ["products.write", "giftAddons.write", "orders.write", "crm.write", "coupons.write", "reviews.write"],
  support: ["crm.write", "reviews.write"],
  content: ["products.write", "giftAddons.write", "reviews.write"],
  warehouse: ["products.write"], // stock lives on the product record itself
};

export function canView(role: Role, section: Section): boolean {
  return SECTION_ACCESS[role]?.includes(section) ?? false;
}

export function canWrite(role: Role, perm: WritePerm): boolean {
  return WRITE_ACCESS[role]?.includes(perm) ?? false;
}

export function sectionsFor(role: Role): Section[] {
  return SECTION_ACCESS[role] ?? [];
}

/** Maps a section to its admin sub-path ("" = the panel root). */
export const SECTION_PATH: Record<Section, string> = {
  products: "",
  giftAddons: "gift-addons",
  gallery: "gallery",
  orders: "orders",
  customers: "customers",
  coupons: "coupons",
  reviews: "reviews",
  analytics: "analytics",
  staff: "staff",
  settings: "settings",
};
