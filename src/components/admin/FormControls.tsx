"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { primaryButton, textInput } from "@/components/admin/styles";

type TextFieldProps = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
} & Pick<InputHTMLAttributes<HTMLInputElement>, "type" | "autoComplete" | "defaultValue" | "required">;

export function TextField({ label, name, error, hint, type = "text", ...inputProps }: TextFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-tm-small font-semibold">
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="mt-1 text-tm-caption text-tm-muted">
          {hint}
        </p>
      ) : null}
      <input
        id={id}
        name={name}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-2 ${textInput}`}
        {...inputProps}
      />
      {error ? (
        <p id={errorId} className="mt-2 text-tm-small font-medium text-tm-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SubmitButton({ children, pendingLabel }: { children: ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={primaryButton} disabled={pending} aria-disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
