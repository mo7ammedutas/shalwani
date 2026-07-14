"use client";

import { useState, type FormEvent } from "react";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Label, TextArea, TextInput } from "@/components/ui/Field";

export function BespokeForm({ dict }: { dict: Dictionary }) {
  const t = dict.bespoke.form;
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("sending");
    try {
      const res = await fetch("/api/bespoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          occasion: form.get("occasion"),
          preferences: form.get("preferences"),
        }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p role="status" className="border border-accent-dark rounded-[var(--radius-soft)] bg-surface px-6 py-5 text-accent-light">
        {t.success}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <h2 className="font-heading text-xl text-text">{t.title}</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="bs-name">{t.name}</Label>
          <TextInput id="bs-name" name="name" required minLength={2} autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="bs-phone">{t.phone}</Label>
          <TextInput id="bs-phone" name="phone" type="tel" dir="ltr" required minLength={7} autoComplete="tel" />
        </div>
      </div>
      <div>
        <Label htmlFor="bs-occasion">{t.occasion}</Label>
        <TextInput id="bs-occasion" name="occasion" required minLength={2} placeholder={t.occasionPlaceholder} />
      </div>
      <div>
        <Label htmlFor="bs-preferences">{t.preferences}</Label>
        <TextArea id="bs-preferences" name="preferences" required minLength={2} placeholder={t.preferencesPlaceholder} />
      </div>
      {state === "error" ? (
        <p role="alert" className="text-sm text-accent-light">
          {t.error}
        </p>
      ) : null}
      <Button type="submit" variant="primary" disabled={state === "sending"} className="self-start">
        {state === "sending" ? t.sending : t.submit}
      </Button>
    </form>
  );
}
