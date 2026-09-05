"use client";

import { useState, type FormEvent } from "react";
import type { DeliveryOption } from "@/types/catalog";
import {
  useCreateDeliveryOption,
  useDeleteDeliveryOption,
  useDeliveryOptionsQuery,
  useUpdateDeliveryOption,
} from "@/lib/api/catalog";
import { useSession } from "@/lib/session/SessionContext";
import { Card } from "@/components/ui/card/Card";
import { Table, type TableColumn } from "@/components/ui/table/Table";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { Textarea } from "@/components/ui/textarea/Textarea";
import { Modal } from "@/components/ui/modal/Modal";
import { Field } from "@/components/ui/field/Field";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { StateMessage } from "@/components/ui/state/StateMessage";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { formatCurrency } from "@/lib/format/number";
import formStyles from "../form.module.css";
import styles from "./catalog.module.css";

interface DeliveryOptionsTabProps {
  initialDeliveryOptions: DeliveryOption[];
}

type ModalState = { mode: "create" } | { mode: "edit"; option: DeliveryOption };

export function DeliveryOptionsTab({ initialDeliveryOptions }: DeliveryOptionsTabProps) {
  const session = useSession();
  const isOwner = session.role === "OWNER";
  const optionsQuery = useDeliveryOptionsQuery({ initialData: initialDeliveryOptions });

  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryOption | null>(null);

  const columns: TableColumn<DeliveryOption>[] = [
    { key: "name", header: "Название", render: (option) => option.name },
    { key: "price", header: "Цена", align: "right", render: (option) => formatCurrency(option.price) },
    { key: "etaDays", header: "Срок, дней", align: "right", render: (option) => option.etaDays ?? "—" },
    { key: "conditions", header: "Условия", render: (option) => option.conditions ?? "—" },
    ...(isOwner
      ? ([
          {
            key: "actions",
            header: "",
            align: "right",
            render: (option: DeliveryOption) => (
              <div className={styles.rowActions}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setModalState({ mode: "edit", option })}
                >
                  Редактировать
                </Button>
                <Button type="button" variant="danger" size="sm" onClick={() => setDeleteTarget(option)}>
                  Удалить
                </Button>
              </div>
            ),
          },
        ] satisfies TableColumn<DeliveryOption>[])
      : []),
  ];

  return (
    <Card>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>Условия доставки</h2>
        {isOwner ? (
          <Button type="button" onClick={() => setModalState({ mode: "create" })}>
            + Условие доставки
          </Button>
        ) : null}
      </div>

      {optionsQuery.isPending ? (
        <Spinner />
      ) : optionsQuery.isError ? (
        <StateMessage tone="error" title="Не удалось загрузить условия доставки" description={optionsQuery.error.message} />
      ) : optionsQuery.data.length === 0 ? (
        <StateMessage title="Условий доставки пока нет" description={isOwner ? "Добавьте первое условие доставки." : undefined} />
      ) : (
        <Table columns={columns} rows={optionsQuery.data} rowKey={(option) => option.id} />
      )}

      {modalState ? <DeliveryOptionFormModal state={modalState} onClose={() => setModalState(null)} /> : null}

      <DeleteDeliveryOptionModal option={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </Card>
  );
}

interface DeliveryOptionFormState {
  name: string;
  price: string;
  etaDays: string;
  conditions: string;
}

function DeliveryOptionFormModal({ state, onClose }: { state: ModalState; onClose: () => void }) {
  const { showToast } = useToast();
  const createOption = useCreateDeliveryOption();
  const updateOption = useUpdateDeliveryOption();
  const isEdit = state.mode === "edit";
  const [form, setForm] = useState<DeliveryOptionFormState>(
    isEdit
      ? {
          name: state.option.name,
          price: state.option.price,
          etaDays: state.option.etaDays !== null ? String(state.option.etaDays) : "",
          conditions: state.option.conditions ?? "",
        }
      : { name: "", price: "", etaDays: "", conditions: "" },
  );
  const [error, setError] = useState<string | null>(null);

  const pending = createOption.isPending || updateOption.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const name = form.name.trim();
    if (!name) {
      setError("Введите название условия доставки.");
      return;
    }

    const priceNum = Number(form.price);
    if (form.price.trim() === "" || Number.isNaN(priceNum) || priceNum < 0) {
      setError("Укажите корректную цену доставки.");
      return;
    }

    let etaDaysNum: number | undefined;
    if (form.etaDays.trim()) {
      etaDaysNum = Number(form.etaDays);
      if (!Number.isInteger(etaDaysNum) || etaDaysNum < 0) {
        setError("Срок доставки должен быть целым числом дней ≥ 0.");
        return;
      }
    }

    const conditions = form.conditions.trim() || undefined;

    if (isEdit) {
      updateOption.mutate(
        { id: state.option.id, dto: { name, price: priceNum, etaDays: etaDaysNum, conditions } },
        {
          onSuccess: () => {
            showToast("Условие доставки обновлено", "success");
            onClose();
          },
          onError: (mutationError) => {
            setError(mutationError instanceof Error ? mutationError.message : "Не удалось сохранить условие доставки.");
          },
        },
      );
    } else {
      createOption.mutate(
        { name, price: priceNum, etaDays: etaDaysNum, conditions },
        {
          onSuccess: () => {
            showToast("Условие доставки создано", "success");
            onClose();
          },
          onError: (mutationError) => {
            setError(mutationError instanceof Error ? mutationError.message : "Не удалось создать условие доставки.");
          },
        },
      );
    }
  }

  const footer = (
    <>
      <Button type="button" variant="secondary" onClick={onClose}>
        Отмена
      </Button>
      <Button type="submit" form="delivery-option-form" loading={pending}>
        {isEdit ? "Сохранить" : "Создать"}
      </Button>
    </>
  );

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Редактировать условие доставки" : "Новое условие доставки"}
      size="md"
      footer={footer}
    >
      <form className={formStyles.form} id="delivery-option-form" onSubmit={handleSubmit}>
        <Field label="Название" required>
          {(fieldProps) => (
            <Input {...fieldProps} autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          )}
        </Field>

        <div className={formStyles.grid2}>
          <Field label="Цена, ₽" required>
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            )}
          </Field>
          <Field label="Срок, дней">
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="number"
                min={0}
                step={1}
                value={form.etaDays}
                onChange={(e) => setForm({ ...form, etaDays: e.target.value })}
              />
            )}
          </Field>
        </div>

        <Field label="Условия">
          {(fieldProps) => (
            <Textarea {...fieldProps} value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} />
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

function DeleteDeliveryOptionModal({ option, onClose }: { option: DeliveryOption | null; onClose: () => void }) {
  const { showToast } = useToast();
  const deleteOption = useDeleteDeliveryOption();
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setError(null);
    deleteOption.reset();
    onClose();
  }

  function handleDelete() {
    if (!option) return;
    setError(null);
    deleteOption.mutate(option.id, {
      onSuccess: () => {
        showToast("Условие доставки удалено", "success");
        handleClose();
      },
      onError: (mutationError) => {
        setError(mutationError instanceof Error ? mutationError.message : "Не удалось удалить условие доставки.");
      },
    });
  }

  return (
    <Modal
      open={Boolean(option)}
      onClose={handleClose}
      title="Удалить условие доставки?"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Отмена
          </Button>
          <Button type="button" variant="danger" onClick={handleDelete} loading={deleteOption.isPending}>
            Удалить
          </Button>
        </>
      }
    >
      <p>
        Условие доставки «{option?.name}» будет удалено. Сделки, где оно уже указано, просто потеряют ссылку на него — это
        не заблокирует удаление.
      </p>
      {error ? (
        <p role="alert" className={formStyles.error}>
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
