"use client";

import { useState } from "react";
import type { Notification } from "@/types/notifications";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotificationsQuery } from "@/lib/api/notifications";
import { Card } from "@/components/ui/card/Card";
import { Button } from "@/components/ui/button/Button";
import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { StateMessage } from "@/components/ui/state/StateMessage";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { NOTIFICATION_TYPE_LABEL } from "@/lib/format/labels";
import { formatDateTime } from "@/lib/format/number";
import styles from "./notifications.module.css";

/** Polled client-side so unread items surface without a manual refresh. */
const REFETCH_INTERVAL_MS = 30_000;

interface NotificationsViewProps {
  initialAll: Notification[];
}

export function NotificationsView({ initialAll }: NotificationsViewProps) {
  const { showToast } = useToast();
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Sending `unreadOnly: false` explicitly would still put `?unreadOnly=false` on the
  // wire; omit it instead so the unchecked state is the exact same query the server
  // component already fetched (and the only one initialData is valid for).
  const notifications = useNotificationsQuery(
    { unreadOnly: unreadOnly || undefined },
    { initialData: unreadOnly ? undefined : initialAll, refetchInterval: REFETCH_INTERVAL_MS },
  );

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.data?.filter((n) => !n.isRead).length ?? 0;

  function handleMarkAllRead() {
    markAllRead.mutate(undefined, {
      onSuccess: ({ updatedCount }) => {
        showToast(`Отмечено прочитанными: ${updatedCount}`, "success");
      },
      onError: (error) => {
        showToast(error instanceof Error ? error.message : "Не удалось отметить уведомления прочитанными", "error");
      },
    });
  }

  function handleMarkRead(id: string) {
    markRead.mutate(id, {
      onError: (error) => {
        showToast(error instanceof Error ? error.message : "Не удалось отметить уведомление прочитанным", "error");
      },
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Уведомления</h1>
      </div>

      <Card>
        <div className={styles.controls}>
          <Checkbox
            label="Только непрочитанные"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />
          {unreadCount > 0 ? (
            <Button type="button" variant="secondary" onClick={handleMarkAllRead} loading={markAllRead.isPending}>
              Отметить все прочитанными
            </Button>
          ) : null}
        </div>

        {notifications.isPending ? (
          <Spinner />
        ) : notifications.isError ? (
          <StateMessage tone="error" title="Не удалось загрузить уведомления" description={notifications.error.message} />
        ) : notifications.data.length === 0 ? (
          <StateMessage
            title={unreadOnly ? "Непрочитанных уведомлений нет" : "Уведомлений пока нет"}
            description="Уведомления появляются здесь по мере срабатывания фоновых задач (нарушение SLA, напоминания о follow-up и т.д.)."
          />
        ) : (
          <ul className={styles.list}>
            {notifications.data.map((notification) => (
              <li
                key={notification.id}
                className={[styles.item, notification.isRead ? styles.itemRead : ""].filter(Boolean).join(" ")}
              >
                <div className={styles.itemHeader}>
                  <span className={styles.itemType}>{NOTIFICATION_TYPE_LABEL[notification.type]}</span>
                  <span className={styles.itemDate}>{formatDateTime(notification.createdAt)}</span>
                </div>

                {typeof notification.payload === "object" && notification.payload !== null ? (
                  <pre className={styles.payload}>{JSON.stringify(notification.payload, null, 2)}</pre>
                ) : null}

                {!notification.isRead ? (
                  <div className={styles.itemFooter}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkRead(notification.id)}
                      loading={markRead.isPending && markRead.variables === notification.id}
                    >
                      Отметить прочитанным
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
