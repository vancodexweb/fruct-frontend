"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Payout, PayoutPeriodDto, PayoutStatus } from "@/types/payouts";
import { PAYOUT_STATUSES } from "@/types/payouts";
import type { User } from "@/types/users";
import {
  useGeneratePayouts,
  usePayoutsPreviewQuery,
  usePayoutsQuery,
  useSendBulkPayouts,
} from "@/lib/api/payouts";
import { Card } from "@/components/ui/card/Card";
import { Table, type TableColumn } from "@/components/ui/table/Table";
import { Badge } from "@/components/ui/badge/Badge";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { Field } from "@/components/ui/field/Field";
import { Select } from "@/components/ui/select/Select";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { StateMessage } from "@/components/ui/state/StateMessage";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { PAYOUT_STATUS_LABEL, PAYOUT_STATUS_TONE } from "@/lib/format/labels";
import { formatCurrency, formatDate, formatDateTime, toDateInputValue, toPeriodEndIso } from "@/lib/format/number";
import styles from "./payouts.module.css";

interface PayoutsViewProps {
  initialPayouts: Payout[];
  managers: User[];
}

function defaultPeriod(): { periodStart: string; periodEnd: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { periodStart: toDateInputValue(start), periodEnd: toDateInputValue(end) };
}

export function PayoutsView({ initialPayouts, managers }: PayoutsViewProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const initial = defaultPeriod();
  const [periodStart, setPeriodStart] = useState(initial.periodStart);
  const [periodEnd, setPeriodEnd] = useState(initial.periodEnd);
  const [periodManagerId, setPeriodManagerId] = useState("");
  const [previewPeriod, setPreviewPeriod] = useState<PayoutPeriodDto | null>(null);
  const [expandedManagers, setExpandedManagers] = useState<Set<string>>(new Set());

  const [filterStatus, setFilterStatus] = useState<PayoutStatus | "">("");
  const [filterManagerId, setFilterManagerId] = useState("");

  const generatePayouts = useGeneratePayouts();
  const sendBulkPayouts = useSendBulkPayouts();

  // periodEnd is extended to the end of that day before it ever reaches the
  // API: the backend does `createdAt <= new Date(periodEnd)`, and a bare
  // date parses as midnight UTC — without this, a manager's deals made on
  // the period's own last day would be silently excluded from the payout.
  const period: PayoutPeriodDto = {
    periodStart,
    periodEnd: toPeriodEndIso(periodEnd),
    managerId: periodManagerId || undefined,
  };

  const previewQuery = usePayoutsPreviewQuery(previewPeriod);

  const listParams = {
    status: filterStatus || undefined,
    managerId: filterManagerId || undefined,
  };
  const isDefaultListQuery = !filterStatus && !filterManagerId;
  const payoutsQuery = usePayoutsQuery(listParams, {
    initialData: isDefaultListQuery ? initialPayouts : undefined,
  });

  const managerNameById = new Map(managers.map((manager) => [manager.id, manager.fullName]));

  function toggleExpanded(managerId: string) {
    setExpandedManagers((prev) => {
      const next = new Set(prev);
      if (next.has(managerId)) {
        next.delete(managerId);
      } else {
        next.add(managerId);
      }
      return next;
    });
  }

  function handlePreview() {
    setPreviewPeriod(period);
  }

  function handleGenerate() {
    generatePayouts.mutate(period, {
      onSuccess: (created) => {
        showToast(`Черновиков выплат создано: ${created.length}`, "success");
      },
      onError: (error) => {
        showToast(error instanceof Error ? error.message : "Не удалось сформировать выплаты.", "error");
      },
    });
  }

  function handleSendBulk() {
    sendBulkPayouts.mutate(period, {
      onSuccess: (result) => {
        showToast(`Поставлено в очередь: ${result.queuedCount}`, "success");
      },
      onError: (error) => {
        showToast(error instanceof Error ? error.message : "Не удалось поставить рассылку в очередь.", "error");
      },
    });
  }

  const columns: TableColumn<Payout>[] = [
    {
      key: "manager",
      header: "Менеджер",
      render: (payout) => managerNameById.get(payout.managerId) ?? "—",
    },
    {
      key: "period",
      header: "Период",
      render: (payout) => `${formatDate(payout.periodStart)} – ${formatDate(payout.periodEnd)}`,
    },
    { key: "baseSalary", header: "Оклад", render: (payout) => formatCurrency(payout.baseSalary) },
    { key: "totalCommission", header: "Комиссия", render: (payout) => formatCurrency(payout.totalCommission) },
    { key: "totalPayout", header: "Итого", render: (payout) => formatCurrency(payout.totalPayout) },
    {
      key: "status",
      header: "Статус",
      render: (payout) => <Badge tone={PAYOUT_STATUS_TONE[payout.status]}>{PAYOUT_STATUS_LABEL[payout.status]}</Badge>,
    },
    {
      key: "emailSentAt",
      header: "Письмо отправлено",
      render: (payout) => (payout.emailSentAt ? formatDateTime(payout.emailSentAt) : "—"),
    },
  ];

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Выплаты</h1>

      <Card>
        <h2 className={styles.sectionTitle}>Период</h2>
        <div className={styles.periodRow}>
          <Field label="С">
            {(fieldProps) => (
              <Input {...fieldProps} type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            )}
          </Field>
          <Field label="По">
            {(fieldProps) => (
              <Input {...fieldProps} type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            )}
          </Field>
          <Field label="Менеджер">
            {(fieldProps) => (
              <Select {...fieldProps} value={periodManagerId} onChange={(e) => setPeriodManagerId(e.target.value)}>
                <option value="">Все менеджеры</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.fullName}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={handlePreview}>
            Предпросмотр
          </Button>
          <Button type="button" onClick={handleGenerate} loading={generatePayouts.isPending}>
            Сформировать
          </Button>
          <Button type="button" variant="secondary" onClick={handleSendBulk} loading={sendBulkPayouts.isPending}>
            Отправить всем
          </Button>
        </div>
        <p className={styles.hint}>Выплаты с нулевой суммой не создаются.</p>

        {previewPeriod ? (
          previewQuery.isPending ? (
            <Spinner />
          ) : previewQuery.isError ? (
            <StateMessage tone="error" title="Не удалось построить предпросмотр" description={previewQuery.error.message} />
          ) : previewQuery.data.length === 0 ? (
            <StateMessage
              title="Нет данных за период"
              description="За выбранный период нет комиссионных сделок ни у одного менеджера."
            />
          ) : (
            <div className={styles.previewList}>
              {previewQuery.data.map((preview) => (
                <div key={preview.managerId} className={styles.previewCard}>
                  <div className={styles.previewHeader}>
                    <span className={styles.previewName}>{preview.managerFullName}</span>
                    <div className={styles.previewStats}>
                      <span>
                        Оклад: <strong>{formatCurrency(preview.baseSalary)}</strong>
                      </span>
                      <span>
                        Комиссия: <strong>{formatCurrency(preview.totalCommission)}</strong>
                      </span>
                      <span>
                        Итого: <strong>{formatCurrency(preview.totalPayout)}</strong>
                      </span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => toggleExpanded(preview.managerId)}>
                      Показать сделки ({preview.deals.length})
                    </Button>
                  </div>

                  {expandedManagers.has(preview.managerId) ? (
                    preview.deals.length === 0 ? (
                      <StateMessage title="Нет сделок" />
                    ) : (
                      <div className={styles.dealsTable}>
                        <Table
                          columns={[
                            { key: "dealId", header: "Сделка", render: (deal) => deal.dealId.slice(0, 8) },
                            { key: "createdAt", header: "Дата", render: (deal) => formatDate(deal.createdAt) },
                            { key: "totalAmount", header: "Сумма", render: (deal) => formatCurrency(deal.totalAmount) },
                            {
                              key: "commissionAmount",
                              header: "Комиссия",
                              render: (deal) => formatCurrency(deal.commissionAmount),
                            },
                          ]}
                          rows={preview.deals}
                          rowKey={(deal) => deal.dealId}
                        />
                      </div>
                    )
                  ) : null}
                </div>
              ))}
            </div>
          )
        ) : null}
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Список выплат</h2>
        <div className={styles.filters}>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as PayoutStatus | "")}
            aria-label="Фильтр по статусу"
          >
            <option value="">Все статусы</option>
            {PAYOUT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {PAYOUT_STATUS_LABEL[value]}
              </option>
            ))}
          </Select>
          <Select
            value={filterManagerId}
            onChange={(e) => setFilterManagerId(e.target.value)}
            aria-label="Фильтр по менеджеру"
          >
            <option value="">Все менеджеры</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.fullName}
              </option>
            ))}
          </Select>
        </div>

        {payoutsQuery.isPending ? (
          <Spinner />
        ) : payoutsQuery.isError ? (
          <StateMessage tone="error" title="Не удалось загрузить выплаты" description={payoutsQuery.error.message} />
        ) : payoutsQuery.data.length === 0 ? (
          <StateMessage title="Выплаты не найдены" description="Сформируйте выплаты за период выше." />
        ) : (
          <Table
            columns={columns}
            rows={payoutsQuery.data}
            rowKey={(payout) => payout.id}
            onRowClick={(payout) => router.push(`/payouts/${payout.id}`)}
          />
        )}
      </Card>
    </div>
  );
}
