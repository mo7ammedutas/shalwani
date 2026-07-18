import Image from "next/image";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { prisma } from "@/lib/db";
import { addGalleryImage, deleteGalleryImage } from "@/app/[locale]/admin/actions";
import { GalleryUpload } from "@/components/admin/GalleryUpload";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { requireSection } from "@/lib/admin-guard";

export default async function AdminGalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>;
}) {
  const [{ locale: raw }, notice] = await Promise.all([params, searchParams]);
  const locale: Locale = isLocale(raw) ? raw : "ar";
  await requireSection(locale, "gallery");
  const dict = getDictionary(locale);
  const t = dict.admin.gallery;

  const images = await prisma.galleryImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const noticeText = notice.error
    ? t.errorNoFile
    : notice.deleted
      ? t.deleted
      : notice.saved
        ? t.saved
        : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-xl text-text">{t.title}</h2>
        <p className="max-w-2xl text-sm text-text-dim">{t.intro}</p>
      </div>

      {noticeText ? (
        <p
          role={notice.error ? "alert" : "status"}
          data-testid="admin-notice"
          className={`border px-4 py-3 text-sm ${
            notice.error
              ? "border-accent-secondary text-accent-secondary"
              : "border-accent-light bg-surface text-accent-light"
          }`}
        >
          {noticeText}
        </p>
      ) : null}

      <GalleryUpload dict={dict} action={addGalleryImage.bind(null, locale)} />

      {images.length === 0 ? (
        <p className="py-10 text-center text-text-dim">{t.empty}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" data-testid="admin-gallery-grid">
          {images.map((img) => (
            <li key={img.id} className="flex flex-col gap-2">
              <span className="relative block aspect-square overflow-hidden border border-surface-muted bg-surface">
                <Image src={img.url} alt="" fill sizes="25vw" className="object-cover" />
              </span>
              {img.captionAr || img.captionEn ? (
                <span className="text-xs text-text-dim">
                  {locale === "ar" ? img.captionAr || img.captionEn : img.captionEn || img.captionAr}
                </span>
              ) : null}
              <DeleteProductButton
                action={deleteGalleryImage.bind(null, locale, img.id)}
                label={t.delete}
                confirmText={t.confirmDelete}
                testId={`delete-gallery-${img.id}`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
