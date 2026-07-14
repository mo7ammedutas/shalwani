import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const controlClasses =
  "w-full bg-surface border border-surface-muted rounded-[var(--radius-soft)] px-4 py-3 font-body text-base text-text placeholder:text-text-dim focus:border-accent focus:outline-none transition-colors duration-[var(--duration-calm)]";

export function Label({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="block mb-2 text-sm tracking-wide text-text-dim">
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${controlClasses} ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea rows={4} {...props} className={`${controlClasses} ${props.className ?? ""}`} />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${controlClasses} ${props.className ?? ""}`} />;
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-sm text-accent-light">
      {message}
    </p>
  );
}
