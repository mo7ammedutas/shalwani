-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "giftAddonsTotalBaisa" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "giftMessage" TEXT,
ADD COLUMN     "isGift" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "shippingFeeBaisa" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shippingZone" TEXT NOT NULL DEFAULT 'oman';

-- CreateTable
CREATE TABLE "GiftAddon" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "priceBaisa" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderGiftAddon" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "addonId" TEXT,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "priceBaisa" INTEGER NOT NULL,

    CONSTRAINT "OrderGiftAddon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GiftAddon_slug_key" ON "GiftAddon"("slug");

-- AddForeignKey
ALTER TABLE "OrderGiftAddon" ADD CONSTRAINT "OrderGiftAddon_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderGiftAddon" ADD CONSTRAINT "OrderGiftAddon_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "GiftAddon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

