import type { DecimalString } from "@/types/common";

const currencyFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Decimal fields arrive from the backend as numeric strings — format directly, never round-trip through a float for money math. */
export function formatCurrency(value: DecimalString | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) return "—";
  return currencyFormatter.format(numeric);
}

export function formatPercent(value: DecimalString | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) return "—";
  return `${numeric}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

export function formatMinutes(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (value < 60) return `${Math.round(value)} мин`;
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return minutes > 0 ? `${hours} ч ${minutes} мин` : `${hours} ч`;
}

/** `<input type="date">` needs yyyy-MM-dd — split off the ISO date portion. */
export function toDateInputValue(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}
