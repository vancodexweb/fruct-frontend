"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import type { Payout, UpdatePayoutDto } from "@/types/payouts";
import type { User } from "@/types/users";
import {
  useApprovePayout,
  usePayPayout,
  usePayoutQuery,
  useSendPayoutEmail,
  useUpdatePayout,
} from "@/lib/api/payouts";
import { Card } from "@/components/ui/card/Card";
import { Badge } from "@/components/ui/badge/Badge";
import { Button } from "@/components/ui/button/Button";
import { Field } from "@/components/ui/field/Field";
import { Input } from "@/components/ui/input/Input";
import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { StateMessage } from "@/components/ui/state/StateMessage";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { PAYOUT_STATUS_LABEL, PAYOUT_STATUS_TONE } from "@/lib/format/labels";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format/number";
import formStyles from "../../form.module.css";
import styles from "./payout-detail.module.css";

interface PayoutDetailViewProps {
  payoutId: string;
  initialPayout: Payout;
  managers: User[];
}

export function PayoutDetailView({ payoutId, initialPayout, managers }: PayoutDetailViewProps) {
  // usePayoutQuery has no initialData option, so the server-fetched payout is used as
  // the render fallback until the client query resolves (avoiding a loading flash for
  // data we already have), and only a background-refetch failure surfaces an error.
  const payoutQuery = usePayoutQuery(payoutId);

  if (payoutQuery.isError && !payoutQuery.data) {
    return <StateMessage tone="error" title="Не удалось загрузить выплату" description={payoutQuery.error.message} />;
  }

  const payout = payoutQuery.data ?? initialPayout;
  const managerName = managers.find((manager) => manager.id === payout.managerId)?.fullName ?? "Менеджер";

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link href="/payouts" className={styles.back}>
            ← Все выплаты
          </Link>
          <h1 className={styles.heading}>{managerName}</h1>
        </div>
        <Badge tone={PAYOUT_STATUS_TONE[payout.status]}>{PAYOUT_STATUS_LABEL[payout.status]}</Badge>
      </div>

      <div className={styles.grid}>
        <Card className={styles.mainCard}>
          <dl className={styles.fields}>
            <Row label="Период">
              {formatDate(payout.periodStart)} – {formatDate(payout.periodEnd)}
            </Row>

            {payout.status === "DRAFT" ? (
              <DraftAmountsForm
                key={`${payout.baseSalary}|${payout.totalCommission}|${payout.totalPayout}`}
                payout={payout}
                payoutId={payoutId}
              />
            ) : (
              <>
                <Row label="Оклад">{formatCurrency(payout.baseSalary)}</Row>
                <Row label="Комиссия">{formatCurrency(payout.totalCommission)}</Row>
                <Row label="Итого">{formatCurrency(payout.totalPayout)}</Row>
              </>
            )}

            <Row label="Утверждена">{formatDateTime(payout.approvedAt)}</Row>
            <Row label="Письмо отправлено">{formatDateTime(payout.emailSentAt)}</Row>
            <Row label="Создана">{formatDateTime(payout.createdAt)}</Row>
          </dl>
        </Card>

        <div className={styles.sideColumn}>
          <Card>
            <h2 className={styles.sideTitle}>Действия</h2>
            {payout.status === "DRAFT" ? <ApproveForm payoutId={payoutId} /> : null}
            {payout.status === "APPROVED" ? <PayForm payoutId={payoutId} /> : null}
            {payout.status === "PAID" ? <p className={styles.muted}>Выплата произведена, изменения недоступны.</p> : null}
          </Card>

          <Card>
            <h2 className={styles.sideTitle}>Расчётный лист</h2>
            <SendEmailButton payoutId={payoutId} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.fieldRow}>
      <dt className={styles.fieldLabel}>{label}</dt>
      <dd className={styles.fieldValue}>{children}</dd>
    </div>
  );
}

function DraftAmountsForm({ payout, payoutId }: { payout: Payout; payoutId: string }) {
  const { showToast } = useToast();
  const updatePayout = useUpdatePayout(payoutId);
  const [baseSalary, setBaseSalary] = useState(payout.baseSalary);
  const [totalCommission, setTotalCommission] = useState(payout.totalCommission);
  const [totalPayout, setTotalPayout] = useState(payout.totalPayout);
  const [error, setError] = useState<string | null>(null);

  const baseSalaryChanged = Number(baseSalary) !== Number(payout.baseSalary);
  const totalCommissionChanged = Number(totalCommission) !== Number(payout.totalCommission);
  const totalPayoutChanged = Number(totalPayout) !== Number(payout.totalPayout);
  const hasChanges = baseSalaryChanged || totalCommissionChanged || totalPayoutChanged;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Only send fields the user actually touched — an untouched totalPayout is left out
    // so the backend recomputes it as baseSalary + totalCommission when either changes.
    const dto: UpdatePayoutDto = {};
    if (baseSalaryChanged) dto.baseSalary = Number(baseSalary);
    if (totalCommissionChanged) dto.totalCommission = Number(totalCommission);
    if (totalPayoutChanged) dto.totalPayout = Number(totalPayout);

    updatePayout.mutate(dto, {
      onSuccess: () => showToast("Изменения сохранены", "success"),
      onError: (mutationError) => {
        setError(mutationError instanceof Error ? mutationError.message : "Не удалось сохранить изменения.");
      },
    });
  }

  return (
    <form className={formStyles.form} onSubmit={handleSubmit}>
      <div className={formStyles.grid2}>
        <Field label="Оклад">
          {(fieldProps) => (
            <Input {...fieldProps} type="number" min={0} step="0.01" value={baseSalary} onChange={(e) => setBaseSalary(e.target.value)} />
          )}
        </Field>
        <Field label="Комиссия">
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="number"
              min={0}
              step="0.01"
              value={totalCommission}
              onChange={(e) => setTotalCommission(e.target.value)}
            />
          )}
        </Field>
      </div>
      <Field label="Итого" hint="Если оставить без изменений, пересчитывается как оклад + комиссия.">
        {(fieldProps) => (
          <Input {...fieldProps} type="number" min={0} step="0.01" value={totalPayout} onChange={(e) => setTotalPayout(e.target.value)} />
        )}
      </Field>
      {error ? (
        <p role="alert" className={formStyles.error}>
          {error}
        </p>
      ) : null}
      <div className={formStyles.modalFooter}>
        <Button type="submit" loading={updatePayout.isPending} disabled={!hasChanges}>
          Сохранить
        </Button>
      </div>
    </form>
  );
}

function ApproveForm({ payoutId }: { payoutId: string }) {
  const { showToast } = useToast();
  const approvePayout = useApprovePayout(payoutId);
  const [notifyManager, setNotifyManager] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    approvePayout.mutate(
      { notifyManager },
      {
        onSuccess: () => showToast("Выплата утверждена", "success"),
        onError: (mutationError) => {
          setError(mutationError instanceof Error ? mutationError.message : "Не удалось утвердить выплату.");
        },
      },
    );
  }

  return (
    <div className={styles.inlineForm}>
      <Checkbox
        label="Уведомить менеджера по email"
        checked={notifyManager}
        onChange={(e) => setNotifyManager(e.target.checked)}
      />
      <Button type="button" onClick={handleApprove} loading={approvePayout.isPending}>
        Утвердить
      </Button>
      {error ? (
        <p role="alert" className={formStyles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PayForm({ payoutId }: { payoutId: string }) {
  const { showToast } = useToast();
  const payPayout = usePayPayout(payoutId);
  const [notifyManager, setNotifyManager] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePay() {
    setError(null);
    payPayout.mutate(
      { notifyManager },
      {
        onSuccess: () => showToast("Выплата отмечена выплаченной", "success"),
        onError: (mutationError) => {
          setError(mutationError instanceof Error ? mutationError.message : "Не удалось отметить выплату выплаченной.");
        },
      },
    );
  }

  return (
    <div className={styles.inlineForm}>
      <Checkbox
        label="Уведомить менеджера по email"
        checked={notifyManager}
        onChange={(e) => setNotifyManager(e.target.checked)}
      />
      <Button type="button" onClick={handlePay} loading={payPayout.isPending}>
        Отметить выплаченной
      </Button>
      {error ? (
        <p role="alert" className={formStyles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SendEmailButton({ payoutId }: { payoutId: string }) {
  const { showToast } = useToast();
  const sendPayoutEmail = useSendPayoutEmail();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    sendPayoutEmail.mutate(payoutId, {
      onSuccess: () => showToast("Расчётный лист отправлен", "success"),
      onError: (mutationError) => {
        setError(mutationError instanceof Error ? mutationError.message : "Не удалось отправить расчётный лист.");
      },
    });
  }

  return (
    <div className={styles.inlineForm}>
      <Button type="button" variant="secondary" onClick={handleClick} loading={sendPayoutEmail.isPending}>
        Отправить расчётный лист
      </Button>
      {error ? (
        <p role="alert" className={formStyles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
