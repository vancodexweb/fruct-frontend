"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Lead, ListLeadsQuery, LeadSource, LeadStatus } from "@/types/leads";
import { LEAD_SOURCES, LEAD_STATUSES } from "@/types/leads";
import type { User } from "@/types/users";
import { useLeadsQuery } from "@/lib/api/leads";
import { Card } from "@/components/ui/card/Card";
import { Table, type TableColumn } from "@/components/ui/table/Table";
import { Badge } from "@/components/ui/badge/Badge";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { Pagination } from "@/components/ui/pagination/Pagination";
import { StateMessage } from "@/components/ui/state/StateMessage";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "@/lib/format/labels";
import { formatDate } from "@/lib/format/number";
import { CreateLeadModal } from "./CreateLeadModal";
import styles from "./leads.module.css";

const LIMIT = 50;

interface LeadsListViewProps {
  initialLeads: Lead[];
  managers: User[];
  isOwner: boolean;
}

export function LeadsListView({ initialLeads, managers, isOwner }: LeadsListViewProps) {
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [source, setSource] = useState<LeadSource | "">("");
  const [assignedManagerId, setAssignedManagerId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  const params: ListLeadsQuery = {
    limit: LIMIT,
    offset,
    status: status || undefined,
    source: source || undefined,
    assignedManagerId: isOwner ? assignedManagerId || undefined : undefined,
    search: search || undefined,
  };

  const isDefaultQuery = offset === 0 && !status && !source && !assignedManagerId && !search;
  const leadsQuery = useLeadsQuery(params, { initialData: isDefaultQuery ? initialLeads : undefined });

  function resetToFirstPage() {
    setOffset(0);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    resetToFirstPage();
  }

  const managerNameById = new Map(managers.map((manager) => [manager.id, manager.fullName]));

  const columns: TableColumn<Lead>[] = [
    { key: "name", header: "Клиент", render: (lead) => lead.fullName || lead.phone || "Без имени" },
    { key: "phone", header: "Телефон", render: (lead) => lead.phone ?? "—" },
    { key: "city", header: "Город", render: (lead) => lead.city ?? "—" },
    { key: "source", header: "Источник", render: (lead) => LEAD_SOURCE_LABEL[lead.source] },
    {
      key: "status",
      header: "Статус",
      render: (lead) => <Badge tone={LEAD_STATUS_TONE[lead.status]}>{LEAD_STATUS_LABEL[lead.status]}</Badge>,
    },
    ...(isOwner
      ? ([
          {
            key: "manager",
            header: "Менеджер",
            render: (lead: Lead) =>
              lead.assignedManagerId ? (managerNameById.get(lead.assignedManagerId) ?? "—") : "Не назначен",
          },
        ] satisfies TableColumn<Lead>[])
      : []),
    { key: "createdAt", header: "Создан", render: (lead) => formatDate(lead.createdAt) },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Лиды</h1>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          + Новый лид
        </Button>
      </div>

      <Card>
        <div className={styles.filters}>
          <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
            <Input
              placeholder="Поиск по имени, телефону, компании"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              aria-label="Поиск лидов"
            />
            <Button type="submit" variant="secondary" size="sm">
              Найти
            </Button>
          </form>

          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as LeadStatus | "");
              resetToFirstPage();
            }}
            aria-label="Фильтр по статусу"
          >
            <option value="">Все статусы</option>
            {LEAD_STATUSES.map((value) => (
              <option key={value} value={value}>
                {LEAD_STATUS_LABEL[value]}
              </option>
            ))}
          </Select>

          <Select
            value={source}
            onChange={(event) => {
              setSource(event.target.value as LeadSource | "");
              resetToFirstPage();
            }}
            aria-label="Фильтр по источнику"
          >
            <option value="">Все источники</option>
            {LEAD_SOURCES.map((value) => (
              <option key={value} value={value}>
                {LEAD_SOURCE_LABEL[value]}
              </option>
            ))}
          </Select>

          {isOwner ? (
            <Select
              value={assignedManagerId}
              onChange={(event) => {
                setAssignedManagerId(event.target.value);
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

        {leadsQuery.isPending ? (
          <Spinner />
        ) : leadsQuery.isError ? (
          <StateMessage tone="error" title="Не удалось загрузить лиды" description={leadsQuery.error.message} />
        ) : leadsQuery.data.length === 0 ? (
          <StateMessage title="Лиды не найдены" description="Попробуйте изменить фильтры или создайте новый лид." />
        ) : (
          <>
            <Table columns={columns} rows={leadsQuery.data} rowKey={(lead) => lead.id} onRowClick={(lead) => router.push(`/leads/${lead.id}`)} />
            <Pagination
              offset={offset}
              limit={LIMIT}
              currentCount={leadsQuery.data.length}
              onPrev={() => setOffset((value) => Math.max(0, value - LIMIT))}
              onNext={() => setOffset((value) => value + LIMIT)}
            />
          </>
        )}
      </Card>

      <CreateLeadModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
