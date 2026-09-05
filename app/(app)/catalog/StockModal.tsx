"use client";

import { useState, type FormEvent } from "react";
import type { Stock, Warehouse } from "@/types/catalog";
import { useSetStock, useStockByWarehouseQuery } from "@/lib/api/catalog";
import { Modal } from "@/components/ui/modal/Modal";
import { Table, type TableColumn } from "@/components/ui/table/Table";
import { Input } from "@/components/ui/input/Input";
import { Button } from "@/components/ui/button/Button";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { StateMessage } from "@/components/ui/state/StateMessage";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { formatCurrency } from "@/lib/format/number";
import formStyles from "../form.module.css";
import styles from "./catalog.module.css";

interface StockModalProps {
  warehouse: Warehouse;
  isOwner: boolean;
  onClose: () => void;
}

/** Per-warehouse stock, opened from a row action on the Warehouses tab. Only OWNER can edit quantities — MANAGER sees a read-only table. */
export function StockModal({ warehouse, isOwner, onClose }: StockModalProps) {
  const stockQuery = useStockByWarehouseQuery(warehouse.id);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const columns: TableColumn<Stock>[] = [
    { key: "name", header: "Товар", render: (stock) => stock.product?.name ?? stock.productId },
    { key: "sku", header: "Артикул", render: (stock) => stock.product?.sku ?? "—" },
    { key: "price", header: "Цена", align: "right", render: (stock) => formatCurrency(stock.product?.price) },
    {
      key: "quantity",
      header: "Остаток",
      align: "right",
      render: (stock) =>
        isOwner && editingProductId === stock.productId ? (
          <StockQuantityEditor
            stock={stock}
            warehouseId={warehouse.id}
            onDone={() => setEditingProductId(null)}
          />
        ) : (
          <div className={styles.rowActions}>
            <span>{stock.quantity}</span>
            {isOwner ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => setEditingProductId(stock.productId)}>
                Изменить
              </Button>
            ) : null}
          </div>
        ),
    },
  ];

  return (
    <Modal open onClose={onClose} title={`Остатки: ${warehouse.name}`} size="lg">
      {stockQuery.isPending ? (
        <Spinner />
      ) : stockQuery.isError ? (
        <StateMessage tone="error" title="Не удалось загрузить остатки" description={stockQuery.error.message} />
      ) : stockQuery.data.length === 0 ? (
        <StateMessage title="На складе пока нет товаров" />
      ) : (
        <Table columns={columns} rows={stockQuery.data} rowKey={(stock) => stock.id} />
      )}
    </Modal>
  );
}

function StockQuantityEditor({
  stock,
  warehouseId,
  onDone,
}: {
  stock: Stock;
  warehouseId: string;
  onDone: () => void;
}) {
  const { showToast } = useToast();
  const setStock = useSetStock();
  const [quantity, setQuantity] = useState(String(stock.quantity));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const value = Number(quantity);
    if (!Number.isInteger(value) || value < 0) {
      setError("Введите целое число ≥ 0.");
      return;
    }

    setStock.mutate(
      { warehouseId, productId: stock.productId, dto: { quantity: value } },
      {
        onSuccess: () => {
          showToast("Остаток обновлён", "success");
          onDone();
        },
        onError: (mutationError) => {
          setError(mutationError instanceof Error ? mutationError.message : "Не удалось сохранить остаток.");
        },
      },
    );
  }

  return (
    <form className={styles.inlineForm} onSubmit={handleSubmit}>
      <span className={styles.qtyLabel}>Точное количество:</span>
      <Input
        type="number"
        min={0}
        step={1}
        value={quantity}
        onChange={(event) => setQuantity(event.target.value)}
        aria-label="Точное количество на складе"
        className={styles.qtyInput}
        autoFocus
      />
      <Button type="submit" size="sm" loading={setStock.isPending}>
        Сохранить
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onDone}>
        Отмена
      </Button>
      {error ? (
        <span role="alert" className={formStyles.error}>
          {error}
        </span>
      ) : null}
    </form>
  );
}
