"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Label, TextInput } from "@/components/ui/Field";

type LoginState = "idle" | "busy" | "error" | "totp" | "totp_error" | "rate_limited";

export function AdminLoginForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [state, setState] = useState<LoginState>("idle");
  const showTotp = state === "totp" || state === "totp_error";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const totp = String(form.get("totp") ?? "");
    setState("busy");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, ...(totp ? { totp } : {}) }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (body.error === "totp_required") setState("totp");
        else if (body.error === "totp_invalid") setState("totp_error");
        else if (res.status === 429) setState("rate_limited");
        else setState("error");
        return;
      }
      // Hard navigation on purpose: the fresh document request carries the
      // new session cookie, avoiding client-router RSC cache races.
      window.location.assign(`/${locale}/admin`);
    } catch {
      setState("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <Label htmlFor="admin-email">{dict.admin.email}</Label>
        <TextInput
          id="admin-email"
          name="email"
          type="email"
          dir="ltr"
          required
          autoComplete="username"
          data-testid="admin-email"
        />
      </div>
      <div>
        <Label htmlFor="admin-password">{dict.admin.password}</Label>
        <TextInput
          id="admin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          data-testid="admin-password"
        />
      </div>

      {showTotp ? (
        <div>
          <Label htmlFor="admin-totp">{dict.admin.totpLabel}</Label>
          <TextInput
            id="admin-totp"
            name="totp"
            dir="ltr"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            minLength={6}
            maxLength={6}
            pattern="\d{6}"
            placeholder="000000"
            autoFocus
            data-testid="admin-totp"
          />
          <p className="mt-1.5 text-xs text-text-dim">{dict.admin.totpRequired}</p>
        </div>
      ) : null}

      {state === "error" ? (
        <p role="alert" className="text-sm text-accent-secondary">
          {dict.admin.loginError}
        </p>
      ) : state === "totp_error" ? (
        <p role="alert" className="text-sm text-accent-secondary">
          {dict.admin.totpInvalid}
        </p>
      ) : state === "rate_limited" ? (
        <p role="alert" className="text-sm text-accent-secondary">
          {dict.admin.rateLimited}
        </p>
      ) : null}

      <Button type="submit" variant="primary" disabled={state === "busy"} data-testid="admin-login">
        {state === "busy" ? dict.admin.loggingIn : dict.admin.login}
      </Button>
    </form>
  );
}
