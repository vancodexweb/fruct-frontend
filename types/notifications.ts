export type NotificationType =
  | "SLA_BREACH"
  | "FOLLOW_UP_DUE"
  | "DEAL_STATUS_CHANGED"
  | "DAILY_DIGEST";

export interface Notification {
  id: string;
  type: NotificationType;
  payload: unknown;
  isRead: boolean;
  createdAt: string;
}

export interface ListNotificationsQuery {
  unreadOnly?: boolean;
}
