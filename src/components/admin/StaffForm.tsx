"use client";

import type { AdminUser } from "@prisma/client";
import type { Dictionary } from "@/lib/i18n";
import { ROLES } from "@/lib/roles";
import { Button } from "@/components/ui/Button";
import { Label, Select, TextInput } from "@/components/ui/Field";

export function StaffForm({
  dict,
  action,
  staff,
  isSelf = false,
  showError,
}: {
  dict: Dictionary;
  action: (formData: FormData) => Promise<void>;
  staff?: AdminUser;
  isSelf?: boolean;
  showError?: string;
}) {
  const t = dict.admin.staff.form;
  const errorMessage =
    showError === "email"
      ? t.errors.emailTaken
      : showError === "self"
        ? dict.admin.staff.cannotModifySelf
        : showError
          ? t.errors.generic
          : null;

  return (
    <form action={action} className="flex max-w-md flex-col gap-5">
      <div>
        <Label htmlFor="sf-name">{t.name}</Label>
        <TextInput id="sf-name" name="name" required minLength={2} defaultValue={staff?.name} data-testid="sf-name" />
      </div>
      <div>
        <Label htmlFor="sf-email">{t.email}</Label>
        <TextInput
          id="sf-email"
          name="email"
          type="email"
          dir="ltr"
          required
          defaultValue={staff?.email}
          data-testid="sf-email"
        />
      </div>
      <div>
        <Label htmlFor="sf-password">{t.password}</Label>
        <TextInput
          id="sf-password"
          name="password"
          type="password"
          dir="ltr"
          minLength={staff ? 0 : 8}
          required={!staff}
          data-testid="sf-password"
        />
        <p className="mt-1.5 text-xs text-text-dim">{staff ? t.passwordHintEdit : t.passwordHintNew}</p>
      </div>
      <div>
        <Label htmlFor="sf-role">{t.role}</Label>
        <Select
          id="sf-role"
          name="role"
          defaultValue={staff?.role ?? "support"}
          disabled={isSelf}
          data-testid="sf-role"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {dict.admin.staff.roles[r] ?? r}
            </option>
          ))}
        </Select>
        <p className="mt-1.5 text-xs text-text-dim">
          {dict.admin.staff.roleHints[staff?.role ?? "support"]}
        </p>
      </div>
      {!isSelf ? (
        <label className="flex items-center gap-3 text-base text-text cursor-pointer">
          <input
            type="checkbox"
            name="active"
            defaultChecked={staff?.active ?? true}
            className="size-4 accent-[var(--color-accent)]"
          />
          {t.active}
        </label>
      ) : null}
      {errorMessage ? (
        <p role="alert" className="border border-accent-secondary/60 px-4 py-3 text-sm text-accent-secondary">
          {errorMessage}
        </p>
      ) : null}
      <Button type="submit" variant="primary" data-testid="sf-save">
        {t.save}
      </Button>
    </form>
  );
}
