"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import type { Deal, DealItem, DealStatus } from "@/types/deals";
import { DEAL_STATUS_TRANSITIONS } from "@/types/deals";
import { useChangeDealStatus, useDealQuery } from "@/lib/api/deals";
import { Card } from "@/components/ui/card/Card";
import { Badge } from "@/components/ui/badge/Badge";
import { Button } from "@/components/ui/button/Button";
import { Select } from "@/components/ui/select/Select";
import { Table, type TableColumn } from "@/components/ui/table/Table";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { StateMessage } from "@/components/ui/state/StateMessage";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { DEAL_STATUS_LABEL, DEAL_STATUS_TONE, PAYMENT_METHOD_LABEL } from "@/lib/format/labels";
import { formatCurrency, formatDateTime } from "@/lib/format/number";
import formStyles from "../../form.module.css";
import styles from "./deal-detail.module.css";

interface DealDetailViewProps {
  dealId: string;
  initialDeal: Deal;
}

export function DealDetailView({ dealId, initialDeal }: DealDetailViewProps) {
  const dealQuery = useDealQuery(dealId, { initialData: initialDeal });

  if (dealQuery.isPending) return <Spinner />;
  if (dealQuery.isError) {
    return <StateMessage tone="error" title="Не удалось загрузить сделку" description={dealQuery.error.message} />;
  }

  const deal = dealQuery.data;

  const itemColumns: TableColumn<DealItem>[] = [
    { key: "product", header: "Товар", render: (item) => item.productName },
    { key: "quantity", header: "Кол-во", render: (item) => String(item.quantity), align: "right" },
    { key: "unitPrice", header: "Цена", render: (item) => formatCurrency(item.unitPrice), align: "right" },
    { key: "subtotal", header: "Сумма", render: (item) => formatCurrency(item.subtotal), align: "right" },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link href="/deals" className={styles.back}>
            ← Все сделки
          </Link>
          <h1 className={styles.heading}>Сделка №{deal.id.slice(0, 8)}</h1>
        </div>
        <Badge tone={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABEL[deal.status]}</Badge>
      </div>

      <div className={styles.grid}>
        <Card className={styles.mainCard}>
          <div>
            <h2 className={styles.sectionTitle}>Товары</h2>
            {deal.items.length === 0 ? (
              <StateMessage title="В сделке нет товаров" />
            ) : (
              <Table columns={itemColumns} rows={deal.items} rowKey={(item) => item.id} />
            )}
          </div>

          <dl className={styles.fields}>
            <FieldRow label="Стоимость доставки">{formatCurrency(deal.deliveryCost)}</FieldRow>
            <FieldRow label="Скидка">{formatCurrency(deal.discount)}</FieldRow>
            <FieldRow label="Надбавка юрлицу (НДС)">{formatCurrency(deal.legalEntityMarkup)}</FieldRow>
            <FieldRow label="Итого">
              <strong>{formatCurrency(deal.totalAmount)}</strong>
            </FieldRow>
            <FieldRow label="Способ оплаты">
              {deal.paymentMethod ? PAYMENT_METHOD_LABEL[deal.paymentMethod] : "—"}
            </FieldRow>
            <FieldRow label="Требуется счёт с НДС">{deal.requiresVatInvoice ? "Да" : "Нет"}</FieldRow>
            <FieldRow label="Комиссия менеджера">
              {formatCurrency(deal.commissionAmount)} ({deal.commissionPercentSnap}% от суммы сделки, зафиксировано
              при создании)
            </FieldRow>
            <FieldRow label="Лид">
              <Link href={`/leads/${deal.leadId}`}>Открыть лид →</Link>
            </FieldRow>
            <FieldRow label="Создана">{formatDateTime(deal.createdAt)}</FieldRow>
            <FieldRow label="Закрыта">{formatDateTime(deal.closedAt)}</FieldRow>
          </dl>
        </Card>

        <div className={styles.sideColumn}>
          <Card>
            <h2 className={styles.sideTitle}>Статус</h2>
            <StatusChanger dealId={dealId} currentStatus={deal.status} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.fieldRow}>
      <dt className={styles.fieldLabel}>{label}</dt>
      <dd className={styles.fieldValue}>{children}</dd>
    </div>
  );
}

function StatusChanger({ dealId, currentStatus }: { dealId: string; currentStatus: DealStatus }) {
  const { showToast } = useToast();
  const changeStatus = useChangeDealStatus(dealId);
  const allowedNext = DEAL_STATUS_TRANSITIONS[currentStatus];
  const [status, setStatus] = useState<DealStatus | "">(allowedNext[0] ?? "");
  const [error, setError] = useState<string | null>(null);

  if (allowedNext.length === 0) {
    return (
      <p className={styles.muted}>
        Статус «{DEAL_STATUS_LABEL[currentStatus]}» финальный — изменение недоступно.
      </p>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!status) return;
    setError(null);
    changeStatus.mutate(
      { status },
      {
        onSuccess: () => showToast("Статус сделки обновлён", "success"),
        onError: (mutationError) => {
          setError(mutationError instanceof Error ? mutationError.message : "Не удалось изменить статус.");
        },
      },
    );
  }

  return (
    <form className={styles.inlineForm} onSubmit={handleSubmit}>
      <Select
        value={status}
        onChange={(event) => setStatus(event.target.value as DealStatus)}
        aria-label="Новый статус сделки"
      >
        {allowedNext.map((value) => (
          <option key={value} value={value}>
            {DEAL_STATUS_LABEL[value]}
          </option>
        ))}
      </Select>
      <Button type="submit" size="sm" loading={changeStatus.isPending}>
        Сохранить
      </Button>
      {error ? (
        <p role="alert" className={formStyles.error}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
