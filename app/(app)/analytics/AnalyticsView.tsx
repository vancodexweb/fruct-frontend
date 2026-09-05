"use client";

import { useState } from "react";
import type {
  FunnelResponse,
  ManagerComparison,
  PeriodQuery,
  PurchaseDistributionResponse,
  RevenueBucket,
  SlaMetricsResponse,
  TopProduct,
} from "@/types/analytics";
import {
  useFunnelQuery,
  useManagersComparisonQuery,
  usePurchaseDistributionQuery,
  useRevenueQuery,
  useSlaMetricsQuery,
  useTopProductsQuery,
} from "@/lib/api/analytics";
import { Card } from "@/components/ui/card/Card";
import { Badge } from "@/components/ui/badge/Badge";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { Field } from "@/components/ui/field/Field";
import { Table, type TableColumn } from "@/components/ui/table/Table";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { StateMessage } from "@/components/ui/state/StateMessage";
import { LEAD_STATUS_LABEL } from "@/lib/format/labels";
import { formatCurrency, formatDate, formatMinutes, toPeriodEndIso } from "@/lib/format/number";
import { VerticalBarChart, HorizontalBarChart, type BarDatum } from "./BarChart";
import styles from "./analytics.module.css";

type GroupBy = "day" | "week" | "month";

const GROUP_BY_LABEL: Record<GroupBy, string> = {
  day: "По дням",
  week: "По неделям",
  month: "По месяцам",
};

/** Postgres EXTRACT(DOW) order — index 0 is Sunday. Do not reorder to Monday-first: the backend's byDayOfWeek array is indexed this way. */
const DAY_OF_WEEK_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const MIN_TOP_PRODUCTS_LIMIT = 1;
const MAX_TOP_PRODUCTS_LIMIT = 100;
const DEFAULT_TOP_PRODUCTS_LIMIT = 10;

function clampLimit(value: number): number {
  if (Number.isNaN(value)) return DEFAULT_TOP_PRODUCTS_LIMIT;
  return Math.min(MAX_TOP_PRODUCTS_LIMIT, Math.max(MIN_TOP_PRODUCTS_LIMIT, Math.round(value)));
}

interface AnalyticsViewProps {
  initialPeriod: PeriodQuery;
  initialFunnel: FunnelResponse;
  initialSla: SlaMetricsResponse;
  initialRevenue: RevenueBucket[];
  initialTopProducts: TopProduct[];
  initialManagers: ManagerComparison[];
  initialPurchaseDistribution: PurchaseDistributionResponse;
}

export function AnalyticsView({
  initialPeriod,
  initialFunnel,
  initialSla,
  initialRevenue,
  initialTopProducts,
  initialManagers,
  initialPurchaseDistribution,
}: AnalyticsViewProps) {
  // Draft controls — copied into the "applied" state below only when the user clicks "Применить",
  // so typing a date or a limit doesn't refetch on every keystroke.
  const [periodStartInput, setPeriodStartInput] = useState(initialPeriod.periodStart);
  const [periodEndInput, setPeriodEndInput] = useState(initialPeriod.periodEnd);
  const [groupByInput, setGroupByInput] = useState<GroupBy>("day");
  const [topProductsLimitInput, setTopProductsLimitInput] = useState(DEFAULT_TOP_PRODUCTS_LIMIT);

  // `periodEnd` here is always the end-of-day-adjusted value actually sent
  // to the backend (see toPeriodEndIso) — the backend treats a bare date as
  // midnight UTC, so an unadjusted upper bound would silently exclude
  // everything created on that day itself. `initialPeriod` stays plain
  // ("YYYY-MM-DD") since it also seeds the date <input>s above; defaultQueryPeriod
  // re-derives the same adjustment so it compares like-for-like with appliedPeriod.
  const defaultQueryPeriod: PeriodQuery = {
    periodStart: initialPeriod.periodStart,
    periodEnd: toPeriodEndIso(initialPeriod.periodEnd),
  };
  const [appliedPeriod, setAppliedPeriod] = useState<PeriodQuery>(defaultQueryPeriod);
  const [appliedGroupBy, setAppliedGroupBy] = useState<GroupBy>("day");
  const [appliedTopProductsLimit, setAppliedTopProductsLimit] = useState(DEFAULT_TOP_PRODUCTS_LIMIT);

  function handleApply() {
    setAppliedPeriod({ periodStart: periodStartInput, periodEnd: toPeriodEndIso(periodEndInput) });
    setAppliedGroupBy(groupByInput);
    setAppliedTopProductsLimit(clampLimit(topProductsLimitInput));
  }

  const isDefaultPeriod =
    appliedPeriod.periodStart === defaultQueryPeriod.periodStart && appliedPeriod.periodEnd === defaultQueryPeriod.periodEnd;
  const isDefaultRevenueQuery = isDefaultPeriod && appliedGroupBy === "day";
  const isDefaultTopProductsQuery = isDefaultPeriod && appliedTopProductsLimit === DEFAULT_TOP_PRODUCTS_LIMIT;

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Аналитика</h1>

      <Card className={styles.toolbar}>
        <div className={styles.toolbarField}>
          <Field label="Начало периода">
            {(fieldProps) => (
              <Input {...fieldProps} type="date" value={periodStartInput} onChange={(e) => setPeriodStartInput(e.target.value)} />
            )}
          </Field>
        </div>
        <div className={styles.toolbarField}>
          <Field label="Конец периода">
            {(fieldProps) => (
              <Input {...fieldProps} type="date" value={periodEndInput} onChange={(e) => setPeriodEndInput(e.target.value)} />
            )}
          </Field>
        </div>
        <div className={styles.toolbarField}>
          <Field label="Группировка выручки">
            {(fieldProps) => (
              <Select {...fieldProps} value={groupByInput} onChange={(e) => setGroupByInput(e.target.value as GroupBy)}>
                {(Object.keys(GROUP_BY_LABEL) as GroupBy[]).map((value) => (
                  <option key={value} value={value}>
                    {GROUP_BY_LABEL[value]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <div className={styles.toolbarField}>
          <Field label="Топ товаров, шт.">
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="number"
                min={MIN_TOP_PRODUCTS_LIMIT}
                max={MAX_TOP_PRODUCTS_LIMIT}
                value={topProductsLimitInput}
                onChange={(e) => setTopProductsLimitInput(Number(e.target.value))}
              />
            )}
          </Field>
        </div>
        <Button type="button" onClick={handleApply}>
          Применить
        </Button>
      </Card>

      <FunnelSection period={appliedPeriod} initialData={isDefaultPeriod ? initialFunnel : undefined} />
      <SlaSection period={appliedPeriod} initialData={isDefaultPeriod ? initialSla : undefined} />
      <RevenueSection
        period={appliedPeriod}
        groupBy={appliedGroupBy}
        initialData={isDefaultRevenueQuery ? initialRevenue : undefined}
      />
      <TopProductsSection
        period={appliedPeriod}
        limit={appliedTopProductsLimit}
        initialData={isDefaultTopProductsQuery ? initialTopProducts : undefined}
      />
      <ManagersSection period={appliedPeriod} initialData={isDefaultPeriod ? initialManagers : undefined} />
      <PurchaseDistributionSection
        period={appliedPeriod}
        initialData={isDefaultPeriod ? initialPurchaseDistribution : undefined}
      />
    </div>
  );
}

function FunnelSection({ period, initialData }: { period: PeriodQuery; initialData?: FunnelResponse }) {
  const funnel = useFunnelQuery(period, { initialData });

  return (
    <Card className={styles.section}>
      <h2 className={styles.sectionTitle}>Воронка</h2>

      {funnel.isPending ? (
        <Spinner />
      ) : funnel.isError ? (
        <StateMessage tone="error" title="Не удалось загрузить воронку" description={funnel.error.message} />
      ) : funnel.data.totalLeads === 0 ? (
        <StateMessage title="За выбранный период лидов нет" />
      ) : (
        <>
          <div className={styles.statRow}>
            <div className={styles.statInline}>
              <span className={styles.statInlineLabel}>Всего лидов</span>
              <span className={styles.statInlineValue}>{funnel.data.totalLeads}</span>
            </div>
            <div className={styles.statInline}>
              <span className={styles.statInlineLabel}>Конверсия в WON</span>
              <span className={styles.statInlineValue}>{funnel.data.conversionRatePercent}%</span>
            </div>
          </div>

          <VerticalBarChart
            ariaLabel="Количество лидов по статусам"
            data={funnel.data.stages.map((stage) => ({
              key: stage.status,
              label: LEAD_STATUS_LABEL[stage.status],
              value: stage.count,
            }))}
          />

          <Table
            columns={
              [
                { key: "status", header: "Статус", render: (row) => LEAD_STATUS_LABEL[row.status] },
                { key: "count", header: "Лидов", render: (row) => String(row.count), align: "right" },
              ] satisfies TableColumn<FunnelResponse["stages"][number]>[]
            }
            rows={funnel.data.stages}
            rowKey={(row) => row.status}
          />
        </>
      )}
    </Card>
  );
}

function SlaSection({ period, initialData }: { period: PeriodQuery; initialData?: SlaMetricsResponse }) {
  const sla = useSlaMetricsQuery(period, { initialData });

  return (
    <Card className={styles.section}>
      <h2 className={styles.sectionTitle}>SLA</h2>

      {sla.isPending ? (
        <Spinner />
      ) : sla.isError ? (
        <StateMessage tone="error" title="Не удалось загрузить метрики SLA" description={sla.error.message} />
      ) : sla.data.totalLeads === 0 ? (
        <StateMessage title="За выбранный период лидов нет" />
      ) : (
        <>
          <div className={styles.statGrid}>
            <Card className={styles.statCard}>
              <span className={styles.statLabel}>Всего лидов</span>
              <span className={styles.statValue}>{sla.data.totalLeads}</span>
            </Card>
            <Card className={styles.statCard}>
              <span className={styles.statLabel}>Отвечено</span>
              <span className={styles.statValue}>{sla.data.respondedCount}</span>
            </Card>
            <Card className={styles.statCard}>
              <span className={styles.statLabel}>Среднее время ответа</span>
              <span className={styles.statValue}>{formatMinutes(sla.data.avgResponseMinutes)}</span>
            </Card>
            <Card className={styles.statCard}>
              <span className={styles.statLabel}>Медиана времени ответа</span>
              <span className={styles.statValue}>{formatMinutes(sla.data.medianResponseMinutes)}</span>
            </Card>
            <Card className={styles.statCard}>
              <span className={styles.statLabel}>Нарушений SLA</span>
              <Badge tone={sla.data.slaBreachCount > 0 ? "error" : "success"}>{sla.data.slaBreachCount}</Badge>
            </Card>
          </div>
          <p className={styles.note}>SLA магазина: {sla.data.slaMinutes} мин</p>
        </>
      )}
    </Card>
  );
}

function RevenueSection({
  period,
  groupBy,
  initialData,
}: {
  period: PeriodQuery;
  groupBy: GroupBy;
  initialData?: RevenueBucket[];
}) {
  const revenue = useRevenueQuery({ ...period, groupBy }, { initialData });

  return (
    <Card className={styles.section}>
      <h2 className={styles.sectionTitle}>Выручка</h2>

      {revenue.isPending ? (
        <Spinner />
      ) : revenue.isError ? (
        <StateMessage tone="error" title="Не удалось загрузить выручку" description={revenue.error.message} />
      ) : revenue.data.length === 0 ? (
        <StateMessage title="За выбранный период данных о выручке нет" />
      ) : (
        <>
          <VerticalBarChart
            ariaLabel="Выручка по периодам"
            color="var(--success)"
            formatValue={(value) => formatCurrency(value)}
            data={revenue.data.map((bucket) => {
              const value = Number(bucket.revenue);
              return {
                key: bucket.periodStart,
                label: formatDate(bucket.periodStart),
                value: Number.isNaN(value) ? 0 : value,
                // Deals count, not revenue, is the on-bar label: it's short at any bar count, while a
                // formatted currency value would clutter once the period spans more than a couple of weeks.
                secondaryLabel: String(bucket.dealsCount),
                title: `${formatDate(bucket.periodStart)}: ${formatCurrency(bucket.revenue)}, сделок: ${bucket.dealsCount}`,
              } satisfies BarDatum;
            })}
          />

          <Table
            columns={
              [
                { key: "period", header: "Период", render: (row) => formatDate(row.periodStart) },
                { key: "revenue", header: "Выручка", render: (row) => formatCurrency(row.revenue), align: "right" },
                { key: "deals", header: "Сделок", render: (row) => String(row.dealsCount), align: "right" },
              ] satisfies TableColumn<RevenueBucket>[]
            }
            rows={revenue.data}
            rowKey={(row) => row.periodStart}
          />
        </>
      )}
    </Card>
  );
}

function TopProductsSection({
  period,
  limit,
  initialData,
}: {
  period: PeriodQuery;
  limit: number;
  initialData?: TopProduct[];
}) {
  const topProducts = useTopProductsQuery({ ...period, limit }, { initialData });

  return (
    <Card className={styles.section}>
      <h2 className={styles.sectionTitle}>Топ товаров</h2>

      {topProducts.isPending ? (
        <Spinner />
      ) : topProducts.isError ? (
        <StateMessage tone="error" title="Не удалось загрузить топ товаров" description={topProducts.error.message} />
      ) : topProducts.data.length === 0 ? (
        <StateMessage title="За выбранный период продаж нет" />
      ) : (
        <>
          <HorizontalBarChart
            ariaLabel="Топ товаров по выручке"
            color="var(--success)"
            formatValue={(value) => formatCurrency(value)}
            data={topProducts.data.map((product) => {
              const value = Number(product.totalRevenue);
              return {
                key: product.productId,
                label: product.productName,
                value: Number.isNaN(value) ? 0 : value,
                title: `${product.productName}: ${formatCurrency(product.totalRevenue)}, шт.: ${product.totalQuantity}`,
              } satisfies BarDatum;
            })}
          />

          <Table
            columns={
              [
                { key: "name", header: "Товар", render: (row) => row.productName },
                { key: "quantity", header: "Кол-во", render: (row) => String(row.totalQuantity), align: "right" },
                { key: "revenue", header: "Выручка", render: (row) => formatCurrency(row.totalRevenue), align: "right" },
              ] satisfies TableColumn<TopProduct>[]
            }
            rows={topProducts.data}
            rowKey={(row) => row.productId}
          />
        </>
      )}
    </Card>
  );
}

function ManagersSection({ period, initialData }: { period: PeriodQuery; initialData?: ManagerComparison[] }) {
  const managers = useManagersComparisonQuery(period, { initialData });

  return (
    <Card className={styles.section}>
      <h2 className={styles.sectionTitle}>Сравнение менеджеров</h2>

      {managers.isPending ? (
        <Spinner />
      ) : managers.isError ? (
        <StateMessage tone="error" title="Не удалось загрузить сравнение менеджеров" description={managers.error.message} />
      ) : managers.data.length === 0 ? (
        <StateMessage title="За выбранный период данных по менеджерам нет" />
      ) : (
        <>
          <Table
            columns={
              [
                { key: "name", header: "Менеджер", render: (row) => row.managerFullName },
                { key: "revenue", header: "Выручка", render: (row) => formatCurrency(row.revenue), align: "right" },
                { key: "deals", header: "Сделок", render: (row) => String(row.dealsCount), align: "right" },
                { key: "assigned", header: "Лидов назначено", render: (row) => String(row.leadsAssigned), align: "right" },
                { key: "won", header: "Лидов выиграно", render: (row) => String(row.leadsWon), align: "right" },
                { key: "conversion", header: "Конверсия", render: (row) => `${row.conversionRatePercent}%`, align: "right" },
                {
                  key: "response",
                  header: "Среднее время ответа",
                  render: (row) => formatMinutes(row.avgResponseMinutes),
                  align: "right",
                },
              ] satisfies TableColumn<ManagerComparison>[]
            }
            rows={managers.data}
            rowKey={(row) => row.managerId}
          />

          <HorizontalBarChart
            ariaLabel="Выручка по менеджерам"
            formatValue={(value) => formatCurrency(value)}
            data={managers.data.map((manager) => {
              const value = Number(manager.revenue);
              return {
                key: manager.managerId,
                label: manager.managerFullName,
                value: Number.isNaN(value) ? 0 : value,
                title: `${manager.managerFullName}: ${formatCurrency(manager.revenue)}`,
              } satisfies BarDatum;
            })}
          />
        </>
      )}
    </Card>
  );
}

function PurchaseDistributionSection({
  period,
  initialData,
}: {
  period: PeriodQuery;
  initialData?: PurchaseDistributionResponse;
}) {
  const distribution = usePurchaseDistributionQuery(period, { initialData });

  return (
    <Card className={styles.section}>
      <h2 className={styles.sectionTitle}>Распределение покупок</h2>

      {distribution.isPending ? (
        <Spinner />
      ) : distribution.isError ? (
        <StateMessage tone="error" title="Не удалось загрузить распределение покупок" description={distribution.error.message} />
      ) : distribution.data.byHour.every((v) => v === 0) && distribution.data.byDayOfWeek.every((v) => v === 0) ? (
        <StateMessage title="За выбранный период закрытых сделок нет" />
      ) : (
        <div className={styles.chartsGrid}>
          <div>
            <p className={styles.subHeading}>По часу дня</p>
            <VerticalBarChart
              ariaLabel="Распределение закрытых сделок по часу дня"
              color="var(--info)"
              data={distribution.data.byHour.map((count, hour) => ({
                key: String(hour),
                label: String(hour),
                value: count,
              }))}
            />
            <Table
              columns={
                [
                  { key: "hour", header: "Час", render: (row) => String(row.hour) },
                  { key: "count", header: "Сделок", render: (row) => String(row.count), align: "right" },
                ] satisfies TableColumn<{ hour: number; count: number }>[]
              }
              rows={distribution.data.byHour.map((count, hour) => ({ hour, count }))}
              rowKey={(row) => String(row.hour)}
            />
          </div>

          <div>
            <p className={styles.subHeading}>По дню недели</p>
            <VerticalBarChart
              ariaLabel="Распределение закрытых сделок по дню недели"
              color="var(--info)"
              data={distribution.data.byDayOfWeek.map((count, index) => ({
                key: String(index),
                label: DAY_OF_WEEK_LABELS[index] ?? String(index),
                value: count,
              }))}
            />
            <Table
              columns={
                [
                  { key: "day", header: "День", render: (row) => row.label },
                  { key: "count", header: "Сделок", render: (row) => String(row.count), align: "right" },
                ] satisfies TableColumn<{ label: string; count: number }>[]
              }
              rows={distribution.data.byDayOfWeek.map((count, index) => ({
                label: DAY_OF_WEEK_LABELS[index] ?? String(index),
                count,
              }))}
              rowKey={(row) => row.label}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
