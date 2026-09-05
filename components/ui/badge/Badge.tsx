import type { ReactNode } from "react";
import styles from "./Badge.module.css";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "error" | "info";

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span className={[styles.badge, styles[tone]].join(" ")}>{children}</span>;
}
