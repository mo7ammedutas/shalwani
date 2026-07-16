"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { FieldError, Label, TextInput } from "@/components/ui/Field";

export function LoginForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.account;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: String(form.get("phone") ?? "").trim(),
          password: String(form.get("password") ?? ""),
        }),
      });
      if (!res.ok) {
        setBusy(false);
        setError(t.errors.invalidCredentials);
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
        <Label htmlFor="lg-phone">{t.phone}</Label>
        <TextInput
          id="lg-phone"
          name="phone"
          type="tel"
          dir="ltr"
          required
          autoComplete="tel"
          placeholder={t.phonePlaceholder}
          data-testid="login-phone"
        />
      </div>
      <div>
        <Label htmlFor="lg-password">{t.password}</Label>
        <TextInput
          id="lg-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          data-testid="login-password"
        />
      </div>
      <FieldError id="lg-err" message={error ?? undefined} />
      <Button type="submit" variant="primary" disabled={busy} data-testid="login-submit">
        {busy ? t.loggingIn : t.login}
      </Button>
      <p className="text-sm text-text-dim">
        {t.noAccount}{" "}
        <Link href={`/${locale}/account/register`} className="text-accent-light underline underline-offset-4">
          {t.createOne}
        </Link>
      </p>
    </form>
  );
}
