"use client";

import { useState, type FormEvent } from "react";
import type { CreateUserDto } from "@/types/users";
import { useCreateManager } from "@/lib/api/users";
import { Modal } from "@/components/ui/modal/Modal";
import { Field } from "@/components/ui/field/Field";
import { Input } from "@/components/ui/input/Input";
import { Button } from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/ToastProvider";
import formStyles from "../form.module.css";

interface CreateManagerModalProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY_FORM = {
  email: "",
  fullName: "",
  password: "",
  commissionPercent: "",
  baseSalary: "",
  maxDiscountPercent: "",
};

export function CreateManagerModal({ open, onClose }: CreateManagerModalProps) {
  const { showToast } = useToast();
  const createManager = useCreateManager();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setForm(EMPTY_FORM);
    setError(null);
    createManager.reset();
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const dto: CreateUserDto = {
      email: form.email.trim(),
      fullName: form.fullName.trim(),
      password: form.password.trim() || undefined,
      commissionPercent: form.commissionPercent === "" ? undefined : Number(form.commissionPercent),
      baseSalary: form.baseSalary === "" ? undefined : Number(form.baseSalary),
      maxDiscountPercent: form.maxDiscountPercent === "" ? undefined : Number(form.maxDiscountPercent),
    };

    createManager.mutate(dto, {
      onSuccess: () => {
        showToast("Менеджер создан", "success");
        handleClose();
      },
      onError: (mutationError) => {
        setError(mutationError instanceof Error ? mutationError.message : "Не удалось создать менеджера.");
      },
    });
  }

  const footer = (
    <>
      <Button type="button" variant="secondary" onClick={handleClose}>
        Отмена
      </Button>
      <Button type="submit" form="create-manager-form" loading={createManager.isPending}>
        Создать
      </Button>
    </>
  );

  return (
    <Modal open={open} onClose={handleClose} title="Новый менеджер" size="md" footer={footer}>
      <form className={formStyles.form} onSubmit={handleSubmit} id="create-manager-form">
        <div className={formStyles.grid2}>
          <Field label="Email" required>
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            )}
          </Field>
          <Field label="ФИО" required>
            {(fieldProps) => (
              <Input {...fieldProps} required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            )}
          </Field>
        </div>

        <Field label="Пароль" hint="Оставьте пустым — временный пароль будет сгенерирован и отправлен на email.">
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          )}
        </Field>

        <div className={formStyles.grid2}>
          <Field label="Комиссия, %">
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={form.commissionPercent}
                onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
              />
            )}
          </Field>
          <Field label="Оклад">
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="number"
                min={0}
                step="0.01"
                value={form.baseSalary}
                onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
              />
            )}
          </Field>
        </div>

        <Field label="Лимит скидки, %">
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={form.maxDiscountPercent}
              onChange={(e) => setForm({ ...form, maxDiscountPercent: e.target.value })}
            />
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
