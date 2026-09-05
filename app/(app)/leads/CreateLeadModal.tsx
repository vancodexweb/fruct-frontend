"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { BuyerType, CreateLeadDto, LeadSource } from "@/types/leads";
import { LEAD_SOURCES } from "@/types/leads";
import { useCreateLead } from "@/lib/api/leads";
import { Modal } from "@/components/ui/modal/Modal";
import { Field } from "@/components/ui/field/Field";
import { Input } from "@/components/ui/input/Input";
import { Textarea } from "@/components/ui/textarea/Textarea";
import { Select } from "@/components/ui/select/Select";
import { Button } from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { LEAD_SOURCE_LABEL } from "@/lib/format/labels";
import formStyles from "../form.module.css";

interface CreateLeadModalProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY_FORM = {
  fullName: "",
  phone: "",
  city: "",
  source: "AVITO" as LeadSource,
  sourceLink: "",
  notes: "",
  buyerType: "INDIVIDUAL" as BuyerType,
  companyName: "",
  inn: "",
};

export function CreateLeadModal({ open, onClose }: CreateLeadModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const createLead = useCreateLead();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setForm(EMPTY_FORM);
    setError(null);
    createLead.reset();
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const dto: CreateLeadDto = {
      fullName: form.fullName.trim() || undefined,
      phone: form.phone.trim() || undefined,
      city: form.city.trim() || undefined,
      source: form.source,
      sourceLink: form.sourceLink.trim() || undefined,
      notes: form.notes.trim() || undefined,
      buyerType: form.buyerType,
      companyName: form.buyerType === "LEGAL_ENTITY" ? form.companyName.trim() || undefined : undefined,
      inn: form.buyerType === "LEGAL_ENTITY" ? form.inn.trim() || undefined : undefined,
    };

    createLead.mutate(dto, {
      onSuccess: (lead) => {
        showToast("Лид создан", "success");
        handleClose();
        router.push(`/leads/${lead.id}`);
      },
      onError: (mutationError) => {
        setError(mutationError instanceof Error ? mutationError.message : "Не удалось создать лид.");
      },
    });
  }

  const footer = (
    <>
      <Button type="button" variant="secondary" onClick={handleClose}>
        Отмена
      </Button>
      <Button type="submit" form="create-lead-form" loading={createLead.isPending}>
        Создать лид
      </Button>
    </>
  );

  return (
    <Modal open={open} onClose={handleClose} title="Новый лид" size="md" footer={footer}>
      <form className={formStyles.form} onSubmit={handleSubmit} id="create-lead-form">
        <div className={formStyles.grid2}>
          <Field label="Имя клиента">
            {(fieldProps) => (
              <Input {...fieldProps} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            )}
          </Field>
          <Field label="Телефон">
            {(fieldProps) => (
              <Input {...fieldProps} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            )}
          </Field>
        </div>

        <div className={formStyles.grid2}>
          <Field label="Город">
            {(fieldProps) => (
              <Input {...fieldProps} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            )}
          </Field>
          <Field label="Источник">
            {(fieldProps) => (
              <Select
                {...fieldProps}
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value as LeadSource })}
              >
                {LEAD_SOURCES.map((value) => (
                  <option key={value} value={value}>
                    {LEAD_SOURCE_LABEL[value]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <Field label="Ссылка на объявление/переписку">
          {(fieldProps) => (
            <Input {...fieldProps} value={form.sourceLink} onChange={(e) => setForm({ ...form, sourceLink: e.target.value })} />
          )}
        </Field>

        <Field label="Тип покупателя">
          {(fieldProps) => (
            <Select
              {...fieldProps}
              value={form.buyerType}
              onChange={(e) => setForm({ ...form, buyerType: e.target.value as BuyerType })}
            >
              <option value="INDIVIDUAL">Физическое лицо</option>
              <option value="LEGAL_ENTITY">Юридическое лицо</option>
            </Select>
          )}
        </Field>

        {form.buyerType === "LEGAL_ENTITY" ? (
          <div className={formStyles.grid2}>
            <Field label="Название компании">
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                />
              )}
            </Field>
            <Field label="ИНН">
              {(fieldProps) => <Input {...fieldProps} value={form.inn} onChange={(e) => setForm({ ...form, inn: e.target.value })} />}
            </Field>
          </div>
        ) : null}

        <Field label="Заметки">
          {(fieldProps) => (
            <Textarea {...fieldProps} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          )}
        </Field>

        {error ? (
          <p role="alert" className={formStyles.error}>
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
