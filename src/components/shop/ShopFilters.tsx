"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Select } from "@/components/ui/Field";

export interface FilterLabels {
  color: string;
  embroidery: string;
  price: string;
  sort: string;
  all: string;
  clear: string;
  sortNewest: string;
  sortPriceAsc: string;
  sortPriceDesc: string;
  priceUnder25: string;
  price25to40: string;
  priceOver40: string;
}

export function ShopFilters({
  labels,
  colorOptions,
  embroideryOptions,
}: {
  labels: FilterLabels;
  colorOptions: { value: string; label: string }[];
  embroideryOptions: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      // Read the live URL rather than the hook value: two quick selections
      // in a row would otherwise build from stale params and drop each other.
      const params = new URLSearchParams(window.location.search);
      if (value) params.set(key, value);
      else params.delete(key);
      router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
    },
    [router, pathname],
  );

  const hasFilters = ["color", "embroidery", "price", "sort"].some((k) =>
    searchParams.has(k),
  );

  const selectField = (
    key: string,
    label: string,
    options: { value: string; label: string }[],
    testId: string,
  ) => (
    <div className="flex flex-col gap-1.5 min-w-36">
      <label htmlFor={`filter-${key}`} className="text-xs tracking-[0.18em] uppercase text-text-dim">
        {label}
      </label>
      <Select
        id={`filter-${key}`}
        data-testid={testId}
        value={searchParams.get(key) ?? ""}
        onChange={(e) => setParam(key, e.target.value)}
        className="!py-2 text-sm"
      >
        <option value="">{labels.all}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );

  return (
    <div className="flex flex-wrap items-end gap-4 md:gap-6">
      {selectField("color", labels.color, colorOptions, "filter-color")}
      {selectField("embroidery", labels.embroidery, embroideryOptions, "filter-embroidery")}
      {selectField(
        "price",
        labels.price,
        [
          { value: "under25", label: labels.priceUnder25 },
          { value: "25to40", label: labels.price25to40 },
          { value: "over40", label: labels.priceOver40 },
        ],
        "filter-price",
      )}
      {selectField(
        "sort",
        labels.sort,
        [
          { value: "newest", label: labels.sortNewest },
          { value: "price-asc", label: labels.sortPriceAsc },
          { value: "price-desc", label: labels.sortPriceDesc },
        ],
        "filter-sort",
      )}
      {hasFilters ? (
        <button
          type="button"
          onClick={() => router.replace(pathname, { scroll: false })}
          className="pb-2.5 text-sm text-text-dim underline underline-offset-4 hover:text-accent-light cursor-pointer"
        >
          {labels.clear}
        </button>
      ) : null}
    </div>
  );
}
