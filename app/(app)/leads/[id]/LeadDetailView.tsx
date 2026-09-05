"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import type { BuyerType, Lead, LeadStatus, UpdateLeadDto } from "@/types/leads";
import { LEAD_STATUSES } from "@/types/leads";
import type { User } from "@/types/users";
import { useAssignLead, useChangeLeadStatus, useDeleteLead, useLeadQuery, useUpdateLead } from "@/lib/api/leads";
import { Card } from "@/components/ui/card/Card";
import { Badge } from "@/components/ui/badge/Badge";
import { Button } from "@/components/ui/button/Button";
import { Field } from "@/components/ui/field/Field";
import { Input } from "@/components/ui/input/Input";
import { Textarea } from "@/components/ui/textarea/Textarea";
import { Select } from "@/components/ui/select/Select";
import { Modal } from "@/components/ui/modal/Modal";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { StateMessage } from "@/components/ui/state/StateMessage";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { BUYER_TYPE_LABEL, LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "@/lib/format/labels";
import { formatDateTime } from "@/lib/format/number";
import formStyles from "../../form.module.css";
import styles from "./lead-detail.module.css";

interface LeadDetailViewProps {
  leadId: string;
  initialLead: Lead;
  managers: User[];
  isOwner: boolean;
}

export function LeadDetailView({ leadId, initialLead, managers, isOwner }: LeadDetailViewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const leadQuery = useLeadQuery(leadId, { initialData: initialLead });
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteLead = useDeleteLead();

  if (leadQuery.isPending) return <Spinner />;
  if (leadQuery.isError) {
    return <StateMessage tone="error" title="Не удалось загрузить лид" description={leadQuery.error.message} />;
  }

  const lead = leadQuery.data;
  const managerName = lead.assignedManagerId
    ? (managers.find((m) => m.id === lead.assignedManagerId)?.fullName ?? "Менеджер")
    : null;

  function handleDelete() {
    setDeleteError(null);
    deleteLead.mutate(leadId, {
      onSuccess: () => {
        showToast("Лид удалён", "success");
        router.push("/leads");
      },
      onError: (error) => {
        setDeleteError(error instanceof Error ? error.message : "Не удалось удалить лид.");
      },
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link href="/leads" className={styles.back}>
            ← Все лиды
          </Link>
          <h1 className={styles.heading}>{lead.fullName || lead.phone || "Лид без имени"}</h1>
        </div>
        <div className={styles.headerActions}>
          <Link href={`/deals/new?leadId=${lead.id}`}>
            <Button type="button" variant="primary">
              Создать сделку
            </Button>
          </Link>
          <Button type="button" variant="secondary" onClick={() => setEditing((v) => !v)}>
            {editing ? "Отменить" : "Редактировать"}
          </Button>
          <Button type="button" variant="danger" onClick={() => setDeleteOpen(true)}>
            Удалить
          </Button>
        </div>
      </div>

      <div className={styles.grid}>
        <Card className={styles.mainCard}>
          {editing ? (
            <EditLeadForm lead={lead} onDone={() => setEditing(false)} />
          ) : (
            <dl className={styles.fields}>
              <Field2 label="Статус">
                <Badge tone={LEAD_STATUS_TONE[lead.status]}>{LEAD_STATUS_LABEL[lead.status]}</Badge>
              </Field2>
              <Field2 label="Телефон">{lead.phone ?? "—"}</Field2>
              <Field2 label="Город">{lead.city ?? "—"}</Field2>
              <Field2 label="Источник">
                {LEAD_SOURCE_LABEL[lead.source]}
                {lead.sourceLink ? (
                  <>
                    {" "}
                    (
                    <a href={lead.sourceLink} target="_blank" rel="noreferrer">
                      ссылка
                    </a>
                    )
                  </>
                ) : null}
              </Field2>
              <Field2 label="Тип покупателя">{BUYER_TYPE_LABEL[lead.buyerType]}</Field2>
              {lead.buyerType === "LEGAL_ENTITY" ? (
                <>
                  <Field2 label="Компания">{lead.companyName ?? "—"}</Field2>
                  <Field2 label="ИНН">{lead.inn ?? "—"}</Field2>
                </>
              ) : null}
              <Field2 label="Заметки">{lead.notes ?? "—"}</Field2>
              <Field2 label="Первый ответ">{formatDateTime(lead.firstResponseAt)}</Field2>
              <Field2 label="Последний контакт">{formatDateTime(lead.lastContactAt)}</Field2>
              <Field2 label="Следующий контакт">{formatDateTime(lead.nextFollowUpAt)}</Field2>
              <Field2 label="Создан">{formatDateTime(lead.createdAt)}</Field2>
            </dl>
          )}
        </Card>

        <div className={styles.sideColumn}>
          <Card>
            <h2 className={styles.sideTitle}>Статус</h2>
            <StatusChanger leadId={leadId} currentStatus={lead.status} />
          </Card>

          <Card>
            <h2 className={styles.sideTitle}>Менеджер</h2>
            {managerName ? <p className={styles.managerName}>{managerName}</p> : <p className={styles.muted}>Не назначен</p>}
            {isOwner ? <AssignManagerForm leadId={leadId} managers={managers} currentManagerId={lead.assignedManagerId} /> : null}
          </Card>
        </div>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Удалить лид?"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)}>
              Отмена
            </Button>
            <Button type="button" variant="danger" onClick={handleDelete} loading={deleteLead.isPending}>
              Удалить
            </Button>
          </>
        }
      >
        <p>Это действие необратимо. Если по лиду уже есть сделки, удаление будет отклонено.</p>
        {deleteError ? (
          <p role="alert" className={formStyles.error}>
            {deleteError}
          </p>
        ) : null}
      </Modal>
    </div>
  );
}

function Field2({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.fieldRow}>
      <dt className={styles.fieldLabel}>{label}</dt>
      <dd className={styles.fieldValue}>{children}</dd>
    </div>
  );
}

function EditLeadForm({ lead, onDone }: { lead: Lead; onDone: () => void }) {
  const { showToast } = useToast();
  const updateLead = useUpdateLead(lead.id);
  const [form, setForm] = useState({
    fullName: lead.fullName ?? "",
    phone: lead.phone ?? "",
    city: lead.city ?? "",
    sourceLink: lead.sourceLink ?? "",
    notes: lead.notes ?? "",
    buyerType: lead.buyerType,
    companyName: lead.companyName ?? "",
    inn: lead.inn ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const dto: UpdateLeadDto = {
      fullName: form.fullName.trim() || undefined,
      phone: form.phone.trim() || undefined,
      city: form.city.trim() || undefined,
      sourceLink: form.sourceLink.trim() || undefined,
      notes: form.notes.trim() || undefined,
      buyerType: form.buyerType,
      companyName: form.buyerType === "LEGAL_ENTITY" ? form.companyName.trim() || undefined : undefined,
      inn: form.buyerType === "LEGAL_ENTITY" ? form.inn.trim() || undefined : undefined,
    };
    updateLead.mutate(dto, {
      onSuccess: () => {
        showToast("Изменения сохранены", "success");
        onDone();
      },
      onError: (mutationError) => {
        setError(mutationError instanceof Error ? mutationError.message : "Не удалось сохранить изменения.");
      },
    });
  }

  return (
    <form className={formStyles.form} onSubmit={handleSubmit}>
      <div className={formStyles.grid2}>
        <Field label="Имя клиента">
          {(fp) => <Input {...fp} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />}
        </Field>
        <Field label="Телефон">
          {(fp) => <Input {...fp} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />}
        </Field>
      </div>
      <div className={formStyles.grid2}>
        <Field label="Город">
          {(fp) => <Input {...fp} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />}
        </Field>
        <Field label="Ссылка на источник">
          {(fp) => <Input {...fp} value={form.sourceLink} onChange={(e) => setForm({ ...form, sourceLink: e.target.value })} />}
        </Field>
      </div>
      <Field label="Тип покупателя">
        {(fp) => (
          <Select {...fp} value={form.buyerType} onChange={(e) => setForm({ ...form, buyerType: e.target.value as BuyerType })}>
            <option value="INDIVIDUAL">Физическое лицо</option>
            <option value="LEGAL_ENTITY">Юридическое лицо</option>
          </Select>
        )}
      </Field>
      {form.buyerType === "LEGAL_ENTITY" ? (
        <div className={formStyles.grid2}>
          <Field label="Компания">
            {(fp) => <Input {...fp} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />}
          </Field>
          <Field label="ИНН">{(fp) => <Input {...fp} value={form.inn} onChange={(e) => setForm({ ...form, inn: e.target.value })} />}</Field>
        </div>
      ) : null}
      <Field label="Заметки">
        {(fp) => <Textarea {...fp} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />}
      </Field>
      {error ? (
        <p role="alert" className={formStyles.error}>
          {error}
        </p>
      ) : null}
      <div className={formStyles.modalFooter}>
        <Button type="button" variant="secondary" onClick={onDone}>
          Отмена
        </Button>
        <Button type="submit" loading={updateLead.isPending}>
          Сохранить
        </Button>
      </div>
    </form>
  );
}

function StatusChanger({ leadId, currentStatus }: { leadId: string; currentStatus: LeadStatus }) {
  const { showToast } = useToast();
  const changeStatus = useChangeLeadStatus(leadId);
  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    changeStatus.mutate(
      { status },
      {
        onSuccess: () => showToast("Статус лида обновлён", "success"),
        onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "Не удалось изменить статус."),
      },
    );
  }

  return (
    <form className={styles.inlineForm} onSubmit={handleSubmit}>
      <Select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)} aria-label="Новый статус лида">
        {LEAD_STATUSES.map((value) => (
          <option key={value} value={value}>
            {LEAD_STATUS_LABEL[value]}
          </option>
        ))}
      </Select>
      <Button type="submit" size="sm" loading={changeStatus.isPending} disabled={status === currentStatus}>
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

function AssignManagerForm({
  leadId,
  managers,
  currentManagerId,
}: {
  leadId: string;
  managers: User[];
  currentManagerId: string | null;
}) {
  const { showToast } = useToast();
  const assignLead = useAssignLead(leadId);
  const [managerId, setManagerId] = useState(currentManagerId ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!managerId) {
      setError("Выберите менеджера.");
      return;
    }
    assignLead.mutate(
      { managerId },
      {
        onSuccess: () => showToast("Менеджер назначен", "success"),
        onError: (mutationError) => setError(mutationError instanceof Error ? mutationError.message : "Не удалось назначить менеджера."),
      },
    );
  }

  return (
    <form className={styles.inlineForm} onSubmit={handleSubmit}>
      <Select value={managerId} onChange={(e) => setManagerId(e.target.value)} aria-label="Выбрать менеджера">
        <option value="">Выберите менеджера</option>
        {managers.map((manager) => (
          <option key={manager.id} value={manager.id}>
            {manager.fullName}
            {!manager.isActive ? " (заблокирован)" : ""}
          </option>
        ))}
      </Select>
      <Button type="submit" size="sm" loading={assignLead.isPending} disabled={managerId === currentManagerId}>
        Назначить
      </Button>
      {error ? (
        <p role="alert" className={formStyles.error}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
