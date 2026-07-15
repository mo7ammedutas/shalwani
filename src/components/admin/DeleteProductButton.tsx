"use client";

export function DeleteProductButton({
  action,
  label,
  confirmText,
  testId,
}: {
  action: () => Promise<void>;
  label: string;
  confirmText: string;
  testId?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        data-testid={testId}
        className="text-sm text-accent-secondary underline underline-offset-4 hover:opacity-80 cursor-pointer"
      >
        {label}
      </button>
    </form>
  );
}
