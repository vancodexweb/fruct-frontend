"use client";

import Link from "next/link";
import type { Lead } from "@/types/leads";
import type { Deal } from "@/types/deals";
import type { Notification } from "@/types/notifications";
import type { FunnelResponse, PeriodQuery, SlaMetricsResponse } from "@/types/analytics";
import type { Role } from "@/types/users";
import { useLeadsQuery } from "@/lib/api/leads";
import { useDealsQuery } from "@/lib/api/deals";
import { useNotificationsQuery } from "@/lib/api/notifications";
import { useFunnelQuery, useSlaMetricsQuery } from "@/lib/api/analytics";
import { Card } from "@/components/ui/card/Card";
import { Badge } from "@/components/ui/badge/Badge";
import { StateMessage } from "@/components/ui/state/StateMessage";
import {
  DEAL_STATUS_LABEL,
  DEAL_STATUS_TONE,
  LEAD_STATUS_LABEL,
  LEAD_STATUS_TONE,
  NOTIFICATION_TYPE_LABEL,
} from "@/lib/format/labels";
import { formatCurrency, formatDateTime, formatMinutes } from "@/lib/format/number";
import styles from "./dashboard.module.css";

interface DashboardViewProps {
  role: Role;
  initialLeads: Lead[];
  initialDeals: Deal[];
  initialNotifications: Notification[];
  periodRange: PeriodQuery;
  initialFunnel: FunnelResponse | null;
  initialSla: SlaMetricsResponse | null;
}

export function DashboardView({
  role,
  initialLeads,
  initialDeals,
  initialNotifications,
  periodRange,
  initialFunnel,
  initialSla,
}: DashboardViewProps) {
  const leads = useLeadsQuery({ limit: 5 }, { initialData: initialLeads });
  const deals = useDealsQuery({ limit: 5 }, { initialData: initialDeals });
  const notifications = useNotificationsQuery({ unreadOnly: true }, { initialData: initialNotifications });

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Дашборд</h1>

      {role === "OWNER" ? (
        <OwnerAnalyticsSummary periodRange={periodRange} initialFunnel={initialFunnel} initialSla={initialSla} />
      ) : null}

      <div className={styles.columns}>
        <Card>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Последние лиды</h2>
            <Link href="/leads" className={styles.cardLink}>
              Все лиды →
            </Link>
          </div>
          {leads.data && leads.data.length > 0 ? (
            <ul className={styles.list}>
              {leads.data.map((lead) => (
                <li key={lead.id} className={styles.listItem}>
                  <Link href={`/leads/${lead.id}`} className={styles.listItemLink}>
                    <span>{lead.fullName ?? lead.phone ?? "Без имени"}</span>
                    <Badge tone={LEAD_STATUS_TONE[lead.status]}>{LEAD_STATUS_LABEL[lead.status]}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <StateMessage title="Лидов пока нет" />
          )}
        </Card>

        <Card>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Последние сделки</h2>
            <Link href="/deals" className={styles.cardLink}>
              Все сделки →
            </Link>
          </div>
          {deals.data && deals.data.length > 0 ? (
            <ul className={styles.list}>
              {deals.data.map((deal) => (
                <li key={deal.id} className={styles.listItem}>
                  <Link href={`/deals/${deal.id}`} className={styles.listItemLink}>
                    <span>{formatCurrency(deal.totalAmount)}</span>
                    <Badge tone={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABEL[deal.status]}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <StateMessage title="Сделок пока нет" />
          )}
        </Card>

        <Card>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Непрочитанные уведомления</h2>
            <Link href="/notifications" className={styles.cardLink}>
              Все уведомления →
            </Link>
          </div>
          {notifications.data && notifications.data.length > 0 ? (
            <ul className={styles.list}>
              {notifications.data.slice(0, 5).map((notification) => (
                <li key={notification.id} className={styles.listItem}>
                  <span>{NOTIFICATION_TYPE_LABEL[notification.type]}</span>
                  <span className={styles.muted}>{formatDateTime(notification.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <StateMessage title="Новых уведомлений нет" />
          )}
        </Card>
      </div>
    </div>
  );
}

function OwnerAnalyticsSummary({
  periodRange,
  initialFunnel,
  initialSla,
}: {
  periodRange: PeriodQuery;
  initialFunnel: FunnelResponse | null;
  initialSla: SlaMetricsResponse | null;
}) {
  const funnel = useFunnelQuery(periodRange, { initialData: initialFunnel ?? undefined });
  const sla = useSlaMetricsQuery(periodRange, { initialData: initialSla ?? undefined });

  return (
    <div className={styles.stats}>
      <Card className={styles.statCard}>
        <span className={styles.statLabel}>Лидов за 30 дней</span>
        <span className={styles.statValue}>{funnel.data?.totalLeads ?? "—"}</span>
      </Card>
      <Card className={styles.statCard}>
        <span className={styles.statLabel}>Конверсия в WON</span>
        <span className={styles.statValue}>{funnel.data ? `${funnel.data.conversionRatePercent}%` : "—"}</span>
      </Card>
      <Card className={styles.statCard}>
        <span className={styles.statLabel}>Среднее время ответа</span>
        <span className={styles.statValue}>{formatMinutes(sla.data?.avgResponseMinutes ?? null)}</span>
      </Card>
      <Card className={styles.statCard}>
        <span className={styles.statLabel}>Нарушений SLA</span>
        <span className={styles.statValue}>{sla.data?.slaBreachCount ?? "—"}</span>
      </Card>
      <Link href="/analytics" className={styles.analyticsLink}>
        Полная аналитика →
      </Link>
    </div>
  );
}
