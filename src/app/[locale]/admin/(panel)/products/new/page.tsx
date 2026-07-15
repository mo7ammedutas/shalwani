import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { createProduct } from "@/app/[locale]/admin/actions";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ locale: raw }, { error }] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  const dict = getDictionary(locale);

  return (
    <div className="flex flex-col gap-8">
      <h2 className="font-heading text-xl text-text">{dict.admin.form.createTitle}</h2>
      <ProductForm dict={dict} action={createProduct.bind(null, locale)} showError={!!error} />
    </div>
  );
}
