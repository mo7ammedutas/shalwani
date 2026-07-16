import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { updateProduct } from "@/app/[locale]/admin/actions";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireSection } from "@/lib/admin-guard";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ locale: raw, id }, { error }] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  await requireSection(locale, "products");
  const dict = getDictionary(locale);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-heading text-xl text-text">
        {dict.admin.form.editTitle} — <span className="text-text-dim">{locale === "ar" ? product.nameAr : product.nameEn}</span>
      </h2>
      <ProductForm
        dict={dict}
        action={updateProduct.bind(null, locale, product.id)}
        product={product}
        showError={!!error}
      />
    </div>
  );
}
