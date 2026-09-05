"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import styles from "./Toast.module.css";

export type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdSeq = 1;
const TOAST_LIFETIME_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = toastIdSeq++;
      setToasts((prev) => [...prev, { id, message, variant }]);
      // Scheduled once, at the moment the toast is created — not a render effect.
      setTimeout(() => removeToast(id), TOAST_LIFETIME_MS);
    },
    [removeToast],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} role="region" aria-label="Уведомления интерфейса">
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.variant]}`} role="status">
            <span className={styles.message}>{toast.message}</span>
            <button
              type="button"
              className={styles.close}
              onClick={() => removeToast(toast.id)}
              aria-label="Закрыть уведомление"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast должен использоваться внутри ToastProvider");
  }
  return ctx;
}
