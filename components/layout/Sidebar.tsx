"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/types/users";
import styles from "./Sidebar.module.css";

interface NavItem {
  href: string;
  label: string;
  ownerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Дашборд" },
  { href: "/leads", label: "Лиды" },
  { href: "/deals", label: "Сделки" },
  { href: "/catalog", label: "Каталог" },
  { href: "/delivery-calc", label: "Расчёт доставки" },
  { href: "/payouts", label: "Выплаты", ownerOnly: true },
  { href: "/analytics", label: "Аналитика", ownerOnly: true },
  { href: "/notifications", label: "Уведомления" },
  { href: "/scripts", label: "Скрипты продаж" },
  { href: "/managers", label: "Менеджеры", ownerOnly: true },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => !item.ownerOnly || role === "OWNER");

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>Fruct CRM</div>
      <nav aria-label="Основная навигация" className={styles.nav}>
        <ul className={styles.list}>
          {items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={[styles.link, active ? styles.active : ""].join(" ")}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
