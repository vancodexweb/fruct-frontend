"use client";

import { useState, type FormEvent } from "react";
import type { UpdateUserDto, User } from "@/types/users";
import { useUpdateManager } from "@/lib/api/users";
import { Modal } from "@/components/ui/modal/Modal";
import { Field } from "@/components/ui/field/Field";
import { Input } from "@/components/ui/input/Input";
import { Button } from "@/components/ui/button/Button";
import { useToast } from "@/components/ui/toast/ToastProvider";
import formStyles from "../form.module.css";

interface EditManagerModalProps {
  manager: User | null;
  onClose: () => void;
}

export function EditManagerModal({ manager, onClose }: EditManagerModalProps) {
  return manager ? <EditManagerModalContent key={manager.id} manager={manager} onClose={onClose} /> : null;
}

function EditManagerModalContent({ manager, onClose }: { manager: User; onClose: () => void }) {
  const { showToast } = useToast();
  const updateManager = useUpdateManager();
  const [form, setForm] = useState({
    fullName: manager.fullName,
    commissionPercent: manager.commissionPercent,
    baseSalary: manager.baseSalary,
    maxDiscountPercent: manager.maxDiscountPercent,
  });
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setError(null);
    updateManager.reset();
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const dto: UpdateUserDto = {
      fullName: form.fullName.trim() || undefined,
      commissionPercent: form.commissionPercent === "" ? undefined : Number(form.commissionPercent),
      baseSalary: form.baseSalary === "" ? undefined : Number(form.baseSalary),
      maxDiscountPercent: form.maxDiscountPercent === "" ? undefined : Number(form.maxDiscountPercent),
    };

    updateManager.mutate(
      { id: manager.id, dto },
      {
        onSuccess: () => {
          showToast("Изменения сохранены", "success");
          handleClose();
        },
        onError: (mutationError) => {
          setError(mutationError instanceof Error ? mutationError.message : "Не удалось сохранить изменения.");
        },
      },
    );
  }

  const footer = (
    <>
      <Button type="button" variant="secondary" onClick={handleClose}>
        Отмена
      </Button>
      <Button type="submit" form="edit-manager-form" loading={updateManager.isPending}>
        Сохранить
      </Button>
    </>
  );

  return (
    <Modal open onClose={handleClose} title={`Редактировать: ${manager.fullName}`} size="md" footer={footer}>
      <form className={formStyles.form} onSubmit={handleSubmit} id="edit-manager-form">
        <Field label="ФИО" required>
          {(fieldProps) => (
            <Input {...fieldProps} required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
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
