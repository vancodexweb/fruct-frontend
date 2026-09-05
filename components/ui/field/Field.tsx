"use client";

import { useId, type ReactNode } from "react";
import styles from "./Field.module.css";

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (fieldProps: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}

/** Renders a label + control + error/hint with matching ids so it stays accessible without repeating boilerplate at every call site. */
export function Field({ label, error, hint, required, children }: FieldProps) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required ? <span className={styles.required} aria-hidden="true"> *</span> : null}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {hint && !error ? (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className={styles.error} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
