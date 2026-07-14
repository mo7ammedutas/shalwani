"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/Button";
import { IconBag } from "@/components/ui/icons";

export function AddToCart({
  product,
  labels,
}: {
  product: {
    slug: string;
    nameAr: string;
    nameEn: string;
    priceBaisa: number;
    image: string;
    stock: number;
  };
  labels: { addToCart: string; added: string; outOfStock: string };
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(t);
  }, [added]);

  if (product.stock <= 0) {
    return (
      <Button variant="quiet" disabled data-testid="add-to-cart">
        {labels.outOfStock}
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      data-testid="add-to-cart"
      onClick={() => {
        addItem(product);
        setAdded(true);
      }}
      aria-live="polite"
    >
      <IconBag className="size-4.5" />
      {added ? labels.added : labels.addToCart}
    </Button>
  );
}
