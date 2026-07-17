"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Label, TextArea } from "@/components/ui/Field";

export function ReviewForm({
  productId,
  dict,
}: {
  productId: string;
  dict: Dictionary;
}) {
  const t = dict.product.reviews;
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, text }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("done");
      router.refresh();
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p role="status" className="border border-accent-light px-4 py-3 text-sm text-accent-light">
        {t.submitted}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex max-w-lg flex-col gap-4" data-testid="review-form">
      <h3 className="font-heading text-lg text-text">{t.writeTitle}</h3>

      <div>
        <Label htmlFor="review-rating">{t.ratingLabel}</Label>
        <div id="review-rating" className="flex gap-1" dir="ltr" role="radiogroup" aria-label={t.ratingLabel}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n}/5`}
              onClick={() => setRating(n)}
              className={`text-2xl leading-none cursor-pointer transition-colors ${
                n <= rating ? "text-accent-light" : "text-surface-muted hover:text-accent-light/50"
              }`}
              data-testid={`rating-${n}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="review-text">{t.textLabel}</Label>
        <TextArea
          id="review-text"
          rows={4}
          required
          minLength={4}
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.textPlaceholder}
          data-testid="review-text"
        />
      </div>

      {state === "error" ? (
        <p role="alert" className="text-sm text-accent-secondary">
          {t.error}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="quiet"
        disabled={state === "sending"}
        className="self-start"
        data-testid="review-submit"
      >
        {state === "sending" ? t.sending : t.submit}
      </Button>
    </form>
  );
}
