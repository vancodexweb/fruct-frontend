import type { BadgeTone } from "@/components/ui/badge/Badge";
import type { BuyerType, LeadSource, LeadStatus } from "@/types/leads";
import type { DealStatus, PaymentMethod } from "@/types/deals";
import type { PayoutStatus } from "@/types/payouts";
import type { NotificationType } from "@/types/notifications";
import type { ScriptCategory } from "@/types/scripts";
import type { Role } from "@/types/users";

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "Новый",
  CONTACTED: "Связались",
  IN_DIALOGUE: "В диалоге",
  PROPOSAL_SENT: "Предложение отправлено",
  WAITING_DECISION: "Ждём решения",
  WON: "Выигран",
  LOST: "Проигран",
};

export const LEAD_STATUS_TONE: Record<LeadStatus, BadgeTone> = {
  NEW: "info",
  CONTACTED: "accent",
  IN_DIALOGUE: "accent",
  PROPOSAL_SENT: "warning",
  WAITING_DECISION: "warning",
  WON: "success",
  LOST: "error",
};

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  AVITO: "Авито",
  YOUDO: "YouDo",
  WEBSITE: "Сайт",
  REFERRAL: "Рекомендация",
  OTHER: "Другое",
};

export const BUYER_TYPE_LABEL: Record<BuyerType, string> = {
  INDIVIDUAL: "Физическое лицо",
  LEGAL_ENTITY: "Юридическое лицо",
};

export const DEAL_STATUS_LABEL: Record<DealStatus, string> = {
  NEW: "Новая",
  WAITING_PAYMENT: "Ждёт оплаты",
  PAID: "Оплачена",
  SHIPPED: "Отгружена",
  COMPLETED: "Завершена",
  CANCELLED: "Отменена",
  REFUNDED: "Возврат",
};

export const DEAL_STATUS_TONE: Record<DealStatus, BadgeTone> = {
  NEW: "info",
  WAITING_PAYMENT: "warning",
  PAID: "accent",
  SHIPPED: "accent",
  COMPLETED: "success",
  CANCELLED: "error",
  REFUNDED: "error",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Наличные",
  CARD: "Карта",
  TRANSFER: "Перевод",
  INSTALLMENT: "Рассрочка",
};

export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  DRAFT: "Черновик",
  APPROVED: "Утверждена",
  PAID: "Выплачена",
};

export const PAYOUT_STATUS_TONE: Record<PayoutStatus, BadgeTone> = {
  DRAFT: "neutral",
  APPROVED: "accent",
  PAID: "success",
};

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  SLA_BREACH: "Нарушение SLA",
  FOLLOW_UP_DUE: "Пора связаться",
  DEAL_STATUS_CHANGED: "Статус сделки изменён",
  DAILY_DIGEST: "Дневная сводка",
};

export const SCRIPT_CATEGORY_LABEL: Record<ScriptCategory, string> = {
  GREETING: "Приветствие",
  PRICE: "Цена",
  DELIVERY: "Доставка",
  WARRANTY: "Гарантия",
  OBJECTION: "Возражение",
  CLOSING: "Закрытие сделки",
  OTHER: "Другое",
};

export const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Владелец",
  MANAGER: "Менеджер",
};
