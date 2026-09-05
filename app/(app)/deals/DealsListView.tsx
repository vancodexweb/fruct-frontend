"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Deal, DealStatus, ListDealsQuery } from "@/types/deals";
import { DEAL_STATUSES } from "@/types/deals";
import type { User } from "@/types/users";
import { useDealsQuery } from "@/lib/api/deals";
import { Card } from "@/components/ui/card/Card";
import { Table, type TableColumn } from "@/components/ui/table/Table";
import { Badge } from "@/components/ui/badge/Badge";
import { Button } from "@/components/ui/button/Button";
import { Select } from "@/components/ui/select/Select";
import { Pagination } from "@/components/ui/pagination/Pagination";
import { StateMessage } from "@/components/ui/state/StateMessage";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { DEAL_STATUS_LABEL, DEAL_STATUS_TONE, PAYMENT_METHOD_LABEL } from "@/lib/format/labels";
import { formatCurrency, formatDate } from "@/lib/format/number";
import styles from "./deals.module.css";

const LIMIT = 50;

interface DealsListViewProps {
  initialDeals: Deal[];
  managers: User[];
  isOwner: boolean;
}

export function DealsListView({ initialDeals, managers, isOwner }: DealsListViewProps) {
  const router = useRouter();
  const [status, setStatus] = useState<DealStatus | "">("");
  const [managerId, setManagerId] = useState("");
  const [offset, setOffset] = useState(0);

  const params: ListDealsQuery = {
    limit: LIMIT,
    offset,
    status: status || undefined,
    managerId: isOwner ? managerId || undefined : undefined,
  };

  const isDefaultQuery = offset === 0 && !status && !managerId;
  const dealsQuery = useDealsQuery(params, { initialData: isDefaultQuery ? initialDeals : undefined });

  function resetToFirstPage() {
    setOffset(0);
  }

  const columns: TableColumn<Deal>[] = [
    {
      key: "lead",
      header: "Лид",
      render: (deal) => (
        <Link href={`/leads/${deal.leadId}`} className={styles.leadLink} onClick={(event) => event.stopPropagation()}>
          {deal.leadId.slice(0, 8)}…
        </Link>
      ),
    },
    { key: "total", header: "Сумма", render: (deal) => formatCurrency(deal.totalAmount), align: "right" },
    {
      key: "status",
      header: "Статус",
      render: (deal) => <Badge tone={DEAL_STATUS_TONE[deal.status]}>{DEAL_STATUS_LABEL[deal.status]}</Badge>,
    },
    {
      key: "paymentMethod",
      header: "Оплата",
      render: (deal) => (deal.paymentMethod ? PAYMENT_METHOD_LABEL[deal.paymentMethod] : "—"),
    },
    { key: "createdAt", header: "Создана", render: (deal) => formatDate(deal.createdAt) },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Сделки</h1>
        <Link href="/deals/new">
          <Button type="button">+ Новая сделка</Button>
        </Link>
      </div>

      <Card>
        <div className={styles.filters}>
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as DealStatus | "");
              resetToFirstPage();
            }}
            aria-label="Фильтр по статусу"
          >
            <option value="">Все статусы</option>
            {DEAL_STATUSES.map((value) => (
              <option key={value} value={value}>
                {DEAL_STATUS_LABEL[value]}
              </option>
            ))}
          </Select>

          {isOwner ? (
            <Select
              value={managerId}
              onChange={(event) => {
                setManagerId(event.target.value);
                resetToFirstPage();
              }}
              aria-label="Фильтр по менеджеру"
            >
              <option value="">Все менеджеры</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.fullName}
                </option>
              ))}
            </Select>
          ) : null}
        </div>

        {dealsQuery.isPending ? (
          <Spinner />
        ) : dealsQuery.isError ? (
          <StateMessage tone="error" title="Не удалось загрузить сделки" description={dealsQuery.error.message} />
        ) : dealsQuery.data.length === 0 ? (
          <StateMessage title="Сделки не найдены" description="Попробуйте изменить фильтры или создайте новую сделку." />
        ) : (
          <>
            <Table
              columns={columns}
              rows={dealsQuery.data}
              rowKey={(deal) => deal.id}
              onRowClick={(deal) => router.push(`/deals/${deal.id}`)}
            />
            <Pagination
              offset={offset}
              limit={LIMIT}
              currentCount={dealsQuery.data.length}
              onPrev={() => setOffset((value) => Math.max(0, value - LIMIT))}
              onNext={() => setOffset((value) => value + LIMIT)}
            />
          </>
        )}
      </Card>
    </div>
  );
}
