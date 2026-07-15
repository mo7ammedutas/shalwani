"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { Label, TextInput } from "@/components/ui/Field";

export function AdminLoginForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("busy");
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setState("error");
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
      {state === "error" ? (
        <p role="alert" className="text-sm text-accent-secondary">
          {dict.admin.loginError}
        </p>
      ) : null}
      <Button type="submit" variant="primary" disabled={state === "busy"} data-testid="admin-login">
        {state === "busy" ? dict.admin.loggingIn : dict.admin.login}
      </Button>
    </form>
  );
}
