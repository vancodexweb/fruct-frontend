"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session/SessionContext";
import { useLogout } from "@/lib/api/auth";
import { useNotificationsQuery } from "@/lib/api/notifications";
import { ThemeToggle } from "@/components/ui/theme-toggle/ThemeToggle";
import { Button } from "@/components/ui/button/Button";
import { ROLE_LABEL } from "@/lib/format/labels";
import styles from "./Topbar.module.css";

export function Topbar() {
  const router = useRouter();
  const session = useSession();
  const logout = useLogout();
  const unread = useNotificationsQuery({ unreadOnly: true }, { refetchInterval: 30_000 });
  const unreadCount = unread.data?.length ?? 0;

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => router.push("/login"),
    });
  }

  return (
    <header className={styles.topbar}>
      <div />
      <div className={styles.actions}>
        <Link
          href="/notifications"
          className={styles.bell}
          aria-label={unreadCount > 0 ? `Уведомления, непрочитанных: ${unreadCount}` : "Уведомления"}
        >
          <span aria-hidden="true">🔔</span>
          {unreadCount > 0 ? <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
        </Link>
        <ThemeToggle />
        <div className={styles.user}>
          <span className={styles.email}>{session.email}</span>
          <span className={styles.role}>{ROLE_LABEL[session.role]}</span>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={handleLogout} loading={logout.isPending}>
          Выйти
        </Button>
      </div>
    </header>
  );
}
