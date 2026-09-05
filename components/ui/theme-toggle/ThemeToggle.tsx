"use client";

import { useState } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme/theme-init-script";
import styles from "./ThemeToggle.module.css";

type ThemeChoice = "light" | "dark" | "system";

function readInitialTheme(): ThemeChoice {
  if (typeof document === "undefined") return "system";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" || attr === "dark" ? attr : "system";
}

const LABEL: Record<ThemeChoice, string> = {
  light: "Светлая",
  dark: "Тёмная",
  system: "Как в системе",
};

const ICON: Record<ThemeChoice, string> = {
  light: "☀️",
  dark: "🌙",
  system: "🖥️",
};

const NEXT: Record<ThemeChoice, ThemeChoice> = {
  light: "dark",
  dark: "system",
  system: "light",
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeChoice>(readInitialTheme);

  function handleClick() {
    const next = NEXT[theme];
    setTheme(next);
    if (next === "system") {
      document.documentElement.removeAttribute("data-theme");
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      document.documentElement.setAttribute("data-theme", next);
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    }
  }

  return (
    <button
      type="button"
      className={styles.button}
      onClick={handleClick}
      aria-label={`Тема оформления: ${LABEL[theme]}. Нажмите, чтобы изменить.`}
      title={`Тема: ${LABEL[theme]}`}
    >
      <span aria-hidden="true">{ICON[theme]}</span>
    </button>
  );
}
