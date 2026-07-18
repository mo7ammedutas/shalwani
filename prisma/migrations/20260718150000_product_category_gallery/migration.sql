-- AlterTable
ALTER TABLE "Product" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'bashmina';

-- CreateTable
CREATE TABLE "GalleryImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "captionAr" TEXT NOT NULL DEFAULT '',
    "captionEn" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);
