"use client";

import { useState } from "react";
import type { BuyerType } from "@/types/leads";
import type { DeliveryCalcItemDto, DeliveryCalcVariant } from "@/types/delivery";
import { useQuoteDelivery } from "@/lib/api/delivery";
import { Modal } from "@/components/ui/modal/Modal";
import { Input } from "@/components/ui/input/Input";
import { Button } from "@/components/ui/button/Button";
import { Badge } from "@/components/ui/badge/Badge";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { StateMessage } from "@/components/ui/state/StateMessage";
import { formatCurrency } from "@/lib/format/number";
import formStyles from "../../form.module.css";
import styles from "./new-deal.module.css";

export interface DeliveryCalcSelection {
  warehouseId: string;
  warehouseName: string;
  deliveryOptionId?: string;
  deliveryQuoteId?: string;
  summary: string;
}

interface DeliveryCalcModalProps {
  open: boolean;
  onClose: () => void;
  items: DeliveryCalcItemDto[];
  buyerType: BuyerType;
  requiresVatInvoice: boolean;
  onSelect: (selection: DeliveryCalcSelection) => void;
}

/**
 * Runs POST /delivery-calc/quote for the deal-in-progress's current items and
 * a destination city, then lets the user pick one warehouse/delivery variant
 * — either a local DeliveryOption or an intercity DeliveryQuote — which the
 * parent form adopts as its warehouseId + deliveryOptionId/deliveryQuoteId.
 */
export function DeliveryCalcModal({
  open,
  onClose,
  items,
  buyerType,
  requiresVatInvoice,
  onSelect,
}: DeliveryCalcModalProps) {
  const [destinationCity, setDestinationCity] = useState("");
  const quoteDelivery = useQuoteDelivery();

  function handleClose() {
    quoteDelivery.reset();
    onClose();
  }

  function handleCalculate() {
    if (!destinationCity.trim() || items.length === 0) return;
    quoteDelivery.mutate({ items, destinationCity: destinationCity.trim(), buyerType, requiresVatInvoice });
  }

  function handleChoose(selection: DeliveryCalcSelection) {
    onSelect(selection);
    quoteDelivery.reset();
    setDestinationCity("");
    onClose();
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={handleClose} title="Расчёт доставки" size="lg">
      <div className={styles.calcModal}>
        <div className={styles.calcSearchRow}>
          <Input
            placeholder="Город получателя"
            value={destinationCity}
            onChange={(event) => setDestinationCity(event.target.value)}
            aria-label="Город получателя"
          />
          <Button
            type="button"
            onClick={handleCalculate}
            loading={quoteDelivery.isPending}
            disabled={!destinationCity.trim() || items.length === 0}
          >
            Рассчитать
          </Button>
        </div>

        {items.length === 0 ? (
          <p className={formStyles.error} role="alert">
            Сначала добавьте товары в сделку.
          </p>
        ) : null}

        {quoteDelivery.isError ? (
          <p role="alert" className={formStyles.error}>
            {quoteDelivery.error instanceof Error ? quoteDelivery.error.message : "Не удалось рассчитать доставку."}
          </p>
        ) : null}

        {quoteDelivery.isPending ? <Spinner /> : null}

        {quoteDelivery.data ? (
          <div className={styles.calcResults}>
            <p className={styles.calcStats}>
              Сумма товаров: {formatCurrency(quoteDelivery.data.subtotal)}
              {Number(quoteDelivery.data.legalEntityMarkup) > 0
                ? ` · Надбавка юрлицу: ${formatCurrency(quoteDelivery.data.legalEntityMarkup)}`
                : ""}
              {" · "}Вес: {quoteDelivery.data.totalWeightKg} кг
            </p>

            {quoteDelivery.data.variants.length === 0 ? (
              <StateMessage title="Нет складов с достаточным остатком по всем позициям" />
            ) : (
              quoteDelivery.data.variants.map((variant) => (
                <VariantCard key={variant.warehouseId} variant={variant} onChoose={handleChoose} />
              ))
            )}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function VariantCard({
  variant,
  onChoose,
}: {
  variant: DeliveryCalcVariant;
  onChoose: (selection: DeliveryCalcSelection) => void;
}) {
  const { quote } = variant;

  return (
    <div className={styles.variantCard}>
      <div className={styles.variantHeader}>
        <div>
          <strong>{variant.warehouseName}</strong>
          <span className={styles.muted}> · {variant.warehouseCity}</span>
        </div>
        <Badge tone={variant.isLocal ? "success" : "accent"}>{variant.isLocal ? "Локально" : "Межгород"}</Badge>
      </div>

      {variant.isLocal && variant.localDeliveryOptions && variant.localDeliveryOptions.length > 0 ? (
        <table className={styles.variantTable}>
          <tbody>
            {variant.localDeliveryOptions.map((option) => (
              <tr key={option.id}>
                <td>{option.name}</td>
                <td>{formatCurrency(option.price)}</td>
                <td>{option.etaDays !== null ? `${option.etaDays} дн.` : "—"}</td>
                <td>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      onChoose({
                        warehouseId: variant.warehouseId,
                        warehouseName: variant.warehouseName,
                        deliveryOptionId: option.id,
                        summary: `${option.name} — ${formatCurrency(option.price)}`,
                      })
                    }
                  >
                    Выбрать
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {!variant.isLocal && quote ? (
        <div className={styles.variantQuote}>
          <span>
            {formatCurrency(quote.cost)} · {quote.etaDaysMin}–{quote.etaDaysMax} дн.
            {quote.isApproximate ? " (приблизительно)" : ""}
          </span>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              onChoose({
                warehouseId: variant.warehouseId,
                warehouseName: variant.warehouseName,
                deliveryQuoteId: quote.id,
                summary: `${formatCurrency(quote.cost)}, ${quote.etaDaysMin}–${quote.etaDaysMax} дн.`,
              })
            }
          >
            Выбрать
          </Button>
        </div>
      ) : null}

      {!variant.isLocal && variant.quoteUnavailableReason ? (
        <StateMessage title="Оценка стоимости недоступна" description={variant.quoteUnavailableReason} />
      ) : null}
    </div>
  );
}
