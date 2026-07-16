"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { FieldError, Label, TextInput } from "@/components/ui/Field";

export function RegisterForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.account;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (name.length < 2) return setError(t.errors.nameRequired);
    if (!/^[+\d][\d\s-]{6,}$/.test(phone)) return setError(t.errors.phoneRequired);
    if (password.length < 8) return setError(t.errors.passwordLength);

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setBusy(false);
        setError(data.error === "phone_taken" ? t.errors.phoneTaken : t.errors.generic);
        return;
      }
      window.location.assign(`/${locale}/account`);
    } catch {
      setBusy(false);
      setError(t.errors.generic);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <Label htmlFor="rg-name">{t.name}</Label>
        <TextInput id="rg-name" name="name" required autoComplete="name" data-testid="register-name" />
      </div>
      <div>
        <Label htmlFor="rg-phone">{t.phone}</Label>
        <TextInput
          id="rg-phone"
          name="phone"
          type="tel"
          dir="ltr"
          required
          autoComplete="tel"
          placeholder={t.phonePlaceholder}
          data-testid="register-phone"
        />
      </div>
      <div>
        <Label htmlFor="rg-email">{t.email}</Label>
        <TextInput id="rg-email" name="email" type="email" dir="ltr" autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="rg-password">{t.password}</Label>
        <TextInput
          id="rg-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          data-testid="register-password"
        />
        <p className="mt-1.5 text-xs text-text-dim">{t.passwordHint}</p>
      </div>
      <FieldError id="rg-err" message={error ?? undefined} />
      <Button type="submit" variant="primary" disabled={busy} data-testid="register-submit">
        {busy ? t.registering : t.register}
      </Button>
      <p className="text-sm text-text-dim">
        {t.haveAccount}{" "}
        <Link href={`/${locale}/account/login`} className="text-accent-light underline underline-offset-4">
          {t.loginInstead}
        </Link>
      </p>
    </form>
  );
}
