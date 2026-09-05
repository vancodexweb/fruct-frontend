"use client";

import { useState, type FormEvent } from "react";
import type { BuyerType } from "@/types/leads";
import type { Product } from "@/types/catalog";
import type { CreateManualDeliveryQuoteDto, DeliveryCalcItemDto, DeliveryCalcQuote, DeliveryCalcVariant } from "@/types/delivery";
import { useProductsQuery, useWarehousesQuery } from "@/lib/api/catalog";
import { useCreateManualDeliveryQuote, useQuoteDelivery } from "@/lib/api/delivery";
import { Card } from "@/components/ui/card/Card";
import { Field } from "@/components/ui/field/Field";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { Button } from "@/components/ui/button/Button";
import { Badge } from "@/components/ui/badge/Badge";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { StateMessage } from "@/components/ui/state/StateMessage";
import { formatCurrency } from "@/lib/format/number";
import formStyles from "../form.module.css";
import styles from "./delivery-calc.module.css";

interface DeliveryCalcViewProps {
  initialProducts: Product[];
}

export function DeliveryCalcView({ initialProducts }: DeliveryCalcViewProps) {
  const productsQuery = useProductsQuery({}, { initialData: initialProducts });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Калькулятор доставки</h1>
      </div>

      {productsQuery.isPending ? (
        <Spinner />
      ) : productsQuery.isError ? (
        <StateMessage tone="error" title="Не удалось загрузить товары" description={productsQuery.error.message} />
      ) : (
        <QuoteCalculator products={productsQuery.data} />
      )}

      <ManualQuoteForm />
    </div>
  );
}

function QuoteCalculator({ products }: { products: Product[] }) {
  const [items, setItems] = useState<DeliveryCalcItemDto[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [destinationCity, setDestinationCity] = useState("");
  const [buyerType, setBuyerType] = useState<BuyerType>("INDIVIDUAL");
  const [requiresVatInvoice, setRequiresVatInvoice] = useState(false);

  const quoteDelivery = useQuoteDelivery();
  const productById = new Map(products.map((product) => [product.id, product]));

  function handleAddItem() {
    if (!productId) return;
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item));
      }
      return [...prev, { productId, quantity }];
    });
    setProductId("");
    setQuantity(1);
  }

  function handleRemoveItem(id: string) {
    setItems((prev) => prev.filter((item) => item.productId !== id));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0 || !destinationCity.trim()) return;
    quoteDelivery.mutate({ items, destinationCity: destinationCity.trim(), buyerType, requiresVatInvoice });
  }

  return (
    <Card>
      <h2 className={styles.sectionTitle}>Рассчитать варианты доставки</h2>
      <form className={formStyles.form} onSubmit={handleSubmit}>
        <div className={styles.itemAddRow}>
          <Select value={productId} onChange={(event) => setProductId(event.target.value)} aria-label="Товар">
            <option value="">Выберите товар</option>
            {products
              .filter((product) => product.isActive)
              .map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} — {formatCurrency(product.price)}
                </option>
              ))}
          </Select>
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
            aria-label="Количество"
          />
          <Button type="button" variant="secondary" size="sm" onClick={handleAddItem} disabled={!productId}>
            Добавить
          </Button>
        </div>

        {items.length === 0 ? (
          <p className={styles.muted}>Товары не добавлены</p>
        ) : (
          <ul className={styles.itemList}>
            {items.map((item) => (
              <li key={item.productId}>
                <span>
                  {productById.get(item.productId)?.name ?? item.productId} × {item.quantity}
                </span>
                <button type="button" className={styles.removeButton} onClick={() => handleRemoveItem(item.productId)}>
                  Удалить
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={formStyles.grid2}>
          <Field label="Город получателя">
            {(fieldProps) => (
              <Input {...fieldProps} value={destinationCity} onChange={(event) => setDestinationCity(event.target.value)} />
            )}
          </Field>
          <Field label="Тип покупателя">
            {(fieldProps) => (
              <Select {...fieldProps} value={buyerType} onChange={(event) => setBuyerType(event.target.value as BuyerType)}>
                <option value="INDIVIDUAL">Физическое лицо</option>
                <option value="LEGAL_ENTITY">Юридическое лицо</option>
              </Select>
            )}
          </Field>
        </div>

        <Checkbox
          label="Требуется счёт с НДС"
          checked={requiresVatInvoice}
          onChange={(event) => setRequiresVatInvoice(event.target.checked)}
        />

        <Button type="submit" loading={quoteDelivery.isPending} disabled={items.length === 0 || !destinationCity.trim()}>
          Рассчитать
        </Button>

        {quoteDelivery.isError ? (
          <p role="alert" className={formStyles.error}>
            {quoteDelivery.error instanceof Error ? quoteDelivery.error.message : "Не удалось рассчитать доставку."}
          </p>
        ) : null}
      </form>

      {quoteDelivery.data ? (
        <div className={styles.results}>
          <p className={styles.stats}>
            Сумма товаров: {formatCurrency(quoteDelivery.data.subtotal)}
            {Number(quoteDelivery.data.legalEntityMarkup) > 0
              ? ` · Надбавка юрлицу: ${formatCurrency(quoteDelivery.data.legalEntityMarkup)}`
              : ""}
            {" · "}Вес: {quoteDelivery.data.totalWeightKg} кг
          </p>

          {quoteDelivery.data.variants.length === 0 ? (
            <StateMessage title="Нет складов с достаточным остатком по всем позициям" />
          ) : (
            quoteDelivery.data.variants.map((variant) => <VariantCard key={variant.warehouseId} variant={variant} />)
          )}
        </div>
      ) : null}
    </Card>
  );
}

function VariantCard({ variant }: { variant: DeliveryCalcVariant }) {
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
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {!variant.isLocal && quote ? (
        <p className={styles.variantQuote}>
          {formatCurrency(quote.cost)} · {quote.etaDaysMin}–{quote.etaDaysMax} дн.
          {quote.isApproximate ? " (приблизительно)" : ""}
        </p>
      ) : null}

      {!variant.isLocal && variant.quoteUnavailableReason ? (
        <StateMessage title="Оценка стоимости недоступна" description={variant.quoteUnavailableReason} />
      ) : null}
    </div>
  );
}

function ManualQuoteForm() {
  const warehousesQuery = useWarehousesQuery();
  const createManualQuote = useCreateManualDeliveryQuote();
  const [form, setForm] = useState({
    warehouseId: "",
    destinationCity: "",
    weightKg: "",
    cost: "",
    etaDaysMin: "",
    etaDaysMax: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [createdQuote, setCreatedQuote] = useState<DeliveryCalcQuote | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.warehouseId || !form.destinationCity.trim() || !form.cost || !form.etaDaysMin || !form.etaDaysMax) {
      setError("Заполните обязательные поля.");
      return;
    }

    const dto: CreateManualDeliveryQuoteDto = {
      warehouseId: form.warehouseId,
      destinationCity: form.destinationCity.trim(),
      weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      cost: Number(form.cost),
      etaDaysMin: Number(form.etaDaysMin),
      etaDaysMax: Number(form.etaDaysMax),
    };

    createManualQuote.mutate(dto, {
      onSuccess: (quote) => setCreatedQuote(quote),
      onError: (mutationError) => {
        setError(mutationError instanceof Error ? mutationError.message : "Не удалось создать оценку доставки.");
      },
    });
  }

  return (
    <Card className={styles.manualCard}>
      <h2 className={styles.sectionTitle}>Зафиксировать доставку вручную</h2>
      <p className={styles.muted}>
        Для случая, когда стоимость межгородской доставки уже известна (созвонились с курьерской службой) — фиксирует
        готовую оценку без обращения к DeepSeek.
      </p>

      {warehousesQuery.isPending ? (
        <Spinner />
      ) : warehousesQuery.isError ? (
        <StateMessage tone="error" title="Не удалось загрузить склады" description={warehousesQuery.error.message} />
      ) : (
        <form className={formStyles.form} onSubmit={handleSubmit}>
          <div className={formStyles.grid2}>
            <Field label="Склад" required>
              {(fieldProps) => (
                <Select {...fieldProps} value={form.warehouseId} onChange={(event) => setForm({ ...form, warehouseId: event.target.value })}>
                  <option value="">Выберите склад</option>
                  {warehousesQuery.data.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.city})
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Город получателя" required>
              {(fieldProps) => (
                <Input {...fieldProps} value={form.destinationCity} onChange={(event) => setForm({ ...form, destinationCity: event.target.value })} />
              )}
            </Field>
          </div>

          <div className={formStyles.grid2}>
            <Field label="Вес, кг">
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.weightKg}
                  onChange={(event) => setForm({ ...form, weightKg: event.target.value })}
                />
              )}
            </Field>
            <Field label="Стоимость, ₽" required>
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="number"
                  min={0}
                  value={form.cost}
                  onChange={(event) => setForm({ ...form, cost: event.target.value })}
                />
              )}
            </Field>
          </div>

          <div className={formStyles.grid2}>
            <Field label="Срок, от (дн.)" required>
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="number"
                  min={0}
                  value={form.etaDaysMin}
                  onChange={(event) => setForm({ ...form, etaDaysMin: event.target.value })}
                />
              )}
            </Field>
            <Field label="Срок, до (дн.)" required>
              {(fieldProps) => (
                <Input
                  {...fieldProps}
                  type="number"
                  min={0}
                  value={form.etaDaysMax}
                  onChange={(event) => setForm({ ...form, etaDaysMax: event.target.value })}
                />
              )}
            </Field>
          </div>

          {error ? (
            <p role="alert" className={formStyles.error}>
              {error}
            </p>
          ) : null}

          <Button type="submit" loading={createManualQuote.isPending}>
            Зафиксировать
          </Button>
        </form>
      )}

      {createdQuote ? (
        <div className={styles.quoteResult}>
          <p>
            Оценка создана. Используйте этот идентификатор как <code>deliveryQuoteId</code> при создании сделки:
          </p>
          <Input readOnly value={createdQuote.id} onFocus={(event) => event.target.select()} aria-label="ID оценки доставки" />
        </div>
      ) : null}
    </Card>
  );
}
