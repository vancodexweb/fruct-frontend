"use client";

import { useId, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import styles from "./Modal.module.css";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  const titleId = useId();

  if (!open) return null;

  function handleOverlayMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      onClose();
    }
  }

  return (
    <div className={styles.overlay} onMouseDown={handleOverlayMouseDown} onKeyDown={handleKeyDown}>
      <div
        className={[styles.dialog, styles[size]].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {/* autoFocus (not an effect — a mount-time DOM prop) ensures Escape works immediately, before the user tabs anywhere. */}
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Закрыть" autoFocus>
            ×
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>
  );
}
