"use client";

import { useState, type FormEvent } from "react";
import type { Warehouse } from "@/types/catalog";
import { useCreateWarehouse, useSetWarehouseActive, useUpdateWarehouse, useWarehousesQuery } from "@/lib/api/catalog";
import { useSession } from "@/lib/session/SessionContext";
import { Card } from "@/components/ui/card/Card";
import { Table, type TableColumn } from "@/components/ui/table/Table";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { Modal } from "@/components/ui/modal/Modal";
import { Field } from "@/components/ui/field/Field";
import { Badge } from "@/components/ui/badge/Badge";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { StateMessage } from "@/components/ui/state/StateMessage";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { StockModal } from "./StockModal";
import formStyles from "../form.module.css";
import styles from "./catalog.module.css";

interface WarehousesTabProps {
  initialWarehouses: Warehouse[];
}

type ModalState = { mode: "create" } | { mode: "edit"; warehouse: Warehouse };

export function WarehousesTab({ initialWarehouses }: WarehousesTabProps) {
  const session = useSession();
  const isOwner = session.role === "OWNER";
  const warehousesQuery = useWarehousesQuery(undefined, { initialData: initialWarehouses });

  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [stockWarehouse, setStockWarehouse] = useState<Warehouse | null>(null);

  const setActive = useSetWarehouseActive();

  const columns: TableColumn<Warehouse>[] = [
    { key: "name", header: "Название", render: (warehouse) => warehouse.name },
    { key: "city", header: "Город", render: (warehouse) => warehouse.city },
    { key: "address", header: "Адрес", render: (warehouse) => warehouse.address ?? "—" },
    {
      key: "status",
      header: "Статус",
      render: (warehouse) => (
        <Badge tone={warehouse.isActive ? "success" : "neutral"}>{warehouse.isActive ? "Активен" : "Неактивен"}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (warehouse) => {
        const isTogglingThis = setActive.isPending && setActive.variables?.id === warehouse.id;
        return (
          <div className={styles.rowActions}>
            <Button type="button" variant="secondary" size="sm" onClick={() => setStockWarehouse(warehouse)}>
              Остатки
            </Button>
            {isOwner ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setModalState({ mode: "edit", warehouse })}
                >
                  Редактировать
                </Button>
                <Button
                  type="button"
                  variant={warehouse.isActive ? "danger" : "secondary"}
                  size="sm"
                  loading={isTogglingThis}
                  onClick={() => setActive.mutate({ id: warehouse.id, active: !warehouse.isActive })}
                >
                  {warehouse.isActive ? "Деактивировать" : "Активировать"}
                </Button>
              </>
            ) : null}
          </div>
        );
      },
    },
  ];

  return (
    <Card>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>Склады</h2>
        {isOwner ? (
          <Button type="button" onClick={() => setModalState({ mode: "create" })}>
            + Склад
          </Button>
        ) : null}
      </div>

      {warehousesQuery.isPending ? (
        <Spinner />
      ) : warehousesQuery.isError ? (
        <StateMessage tone="error" title="Не удалось загрузить склады" description={warehousesQuery.error.message} />
      ) : warehousesQuery.data.length === 0 ? (
        <StateMessage title="Склады не найдены" description={isOwner ? "Добавьте первый склад." : undefined} />
      ) : (
        <Table columns={columns} rows={warehousesQuery.data} rowKey={(warehouse) => warehouse.id} />
      )}

      {modalState ? <WarehouseFormModal state={modalState} onClose={() => setModalState(null)} /> : null}

      {stockWarehouse ? (
        <StockModal warehouse={stockWarehouse} isOwner={isOwner} onClose={() => setStockWarehouse(null)} />
      ) : null}
    </Card>
  );
}

interface WarehouseFormState {
  name: string;
  city: string;
  address: string;
}

function WarehouseFormModal({ state, onClose }: { state: ModalState; onClose: () => void }) {
  const { showToast } = useToast();
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const isEdit = state.mode === "edit";
  const [form, setForm] = useState<WarehouseFormState>(
    isEdit
      ? { name: state.warehouse.name, city: state.warehouse.city, address: state.warehouse.address ?? "" }
      : { name: "", city: "", address: "" },
  );
  const [error, setError] = useState<string | null>(null);

  const pending = createWarehouse.isPending || updateWarehouse.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const name = form.name.trim();
    const city = form.city.trim();
    if (!name || !city) {
      setError("Укажите название и город склада.");
      return;
    }
    const address = form.address.trim() || undefined;

    if (isEdit) {
      updateWarehouse.mutate(
        { id: state.warehouse.id, dto: { name, city, address } },
        {
          onSuccess: () => {
            showToast("Склад обновлён", "success");
            onClose();
          },
          onError: (mutationError) => {
            setError(mutationError instanceof Error ? mutationError.message : "Не удалось сохранить склад.");
          },
        },
      );
    } else {
      createWarehouse.mutate(
        { name, city, address },
        {
          onSuccess: () => {
            showToast("Склад создан", "success");
            onClose();
          },
          onError: (mutationError) => {
            setError(mutationError instanceof Error ? mutationError.message : "Не удалось создать склад.");
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
      <Button type="submit" form="warehouse-form" loading={pending}>
        {isEdit ? "Сохранить" : "Создать"}
      </Button>
    </>
  );

  return (
    <Modal open onClose={onClose} title={isEdit ? "Редактировать склад" : "Новый склад"} size="sm" footer={footer}>
      <form className={formStyles.form} id="warehouse-form" onSubmit={handleSubmit}>
        <Field label="Название" required>
          {(fieldProps) => (
            <Input {...fieldProps} autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          )}
        </Field>
        <Field label="Город" required>
          {(fieldProps) => <Input {...fieldProps} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />}
        </Field>
        <Field label="Адрес">
          {(fieldProps) => (
            <Input {...fieldProps} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
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
