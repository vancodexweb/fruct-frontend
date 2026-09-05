import type { ReactNode } from "react";
import styles from "./StateMessage.module.css";

interface StateMessageProps {
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "empty" | "error";
}

/** Shared shape for "empty list" and "request failed" states — the two non-loading states every list/detail view needs. */
export function StateMessage({ title, description, action, tone = "empty" }: StateMessageProps) {
  return (
    <div className={[styles.wrapper, tone === "error" ? styles.error : ""].join(" ")} role={tone === "error" ? "alert" : undefined}>
      <p className={styles.title}>{title}</p>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
