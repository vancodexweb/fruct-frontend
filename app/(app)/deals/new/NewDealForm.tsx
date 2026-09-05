"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Lead } from "@/types/leads";
import type { Product } from "@/types/catalog";
import type { CreateDealDto, CreateDealItemDto, PaymentMethod } from "@/types/deals";
import { PAYMENT_METHODS } from "@/types/deals";
import { useLeadsQuery } from "@/lib/api/leads";
import { useDeliveryOptionsQuery, useProductsQuery, useWarehousesQuery } from "@/lib/api/catalog";
import { useCreateDeal } from "@/lib/api/deals";
import { useMeQuery } from "@/lib/api/users";
import { useSession } from "@/lib/session/SessionContext";
import { Card } from "@/components/ui/card/Card";
import { Field } from "@/components/ui/field/Field";
import { Input } from "@/components/ui/input/Input";
import { Select } from "@/components/ui/select/Select";
import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { Button } from "@/components/ui/button/Button";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { StateMessage } from "@/components/ui/state/StateMessage";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { BUYER_TYPE_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/format/labels";
import { formatCurrency } from "@/lib/format/number";
import { DeliveryCalcModal, type DeliveryCalcSelection } from "./DeliveryCalcModal";
import formStyles from "../../form.module.css";
import styles from "./new-deal.module.css";

type DeliveryMethod = "NONE" | "OPTION" | "QUOTE" | "MANUAL";

interface NewDealFormProps {
  lockedLead: Lead | null;
}

export function NewDealForm({ lockedLead }: NewDealFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const session = useSession();

  const productsQuery = useProductsQuery();
  const warehousesQuery = useWarehousesQuery();
  const deliveryOptionsQuery = useDeliveryOptionsQuery();
  const meQuery = useMeQuery();
  const createDeal = useCreateDeal();

  const [freeSelectedLead, setFreeSelectedLead] = useState<Lead | null>(null);
  const selectedLead = lockedLead ?? freeSelectedLead;

  const [items, setItems] = useState<CreateDealItemDto[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [requiresVatInvoice, setRequiresVatInvoice] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("NONE");
  const [deliveryOptionId, setDeliveryOptionId] = useState("");
  const [deliveryCostInput, setDeliveryCostInput] = useState("");
  const [calcSelection, setCalcSelection] = useState<DeliveryCalcSelection | null>(null);
  const [calcModalOpen, setCalcModalOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const products = productsQuery.data ?? [];
  const productById = new Map(products.map((product) => [product.id, product]));

  const subtotal = items.reduce((sum, item) => {
    const product = productById.get(item.productId);
    return sum + (product ? Number(product.price) * item.quantity : 0);
  }, 0);

  const isLegalEntity = selectedLead?.buyerType === "LEGAL_ENTITY";
  const isManager = session.role === "MANAGER";
  const discountHint =
    isManager && meQuery.data
      ? `Ваш лимит скидки: ${meQuery.data.maxDiscountPercent}% от суммы товаров (≈ ${formatCurrency(
          (subtotal * Number(meQuery.data.maxDiscountPercent)) / 100,
        )})`
      : undefined;

  const resolvedWarehouseId = deliveryMethod === "QUOTE" ? (calcSelection?.warehouseId ?? "") : warehouseId;

  function handleAddItem(item: CreateDealItemDto) {
    setItems((prev) => {
      const existing = prev.find((existingItem) => existingItem.productId === item.productId);
      if (existing) {
        return prev.map((existingItem) =>
          existingItem.productId === item.productId
            ? { ...existingItem, quantity: existingItem.quantity + item.quantity }
            : existingItem,
        );
      }
      return [...prev, item];
    });
  }

  function handleRemoveItem(productId: string) {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }

  function handleDeliveryMethodChange(method: DeliveryMethod) {
    setDeliveryMethod(method);
  }

  function handleCalcSelect(selection: DeliveryCalcSelection) {
    setCalcSelection(selection);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!selectedLead) {
      setError("Выберите лида для сделки.");
      return;
    }
    if (items.length === 0) {
      setError("Добавьте хотя бы один товар.");
      return;
    }
    if (!resolvedWarehouseId) {
      setError(
        deliveryMethod === "QUOTE"
          ? "Рассчитайте доставку и выберите вариант — он определит склад отгрузки."
          : "Выберите склад отгрузки.",
      );
      return;
    }
    if (deliveryMethod === "OPTION" && !deliveryOptionId) {
      setError("Выберите вариант локальной доставки.");
      return;
    }
    if (deliveryMethod === "MANUAL" && !deliveryCostInput) {
      setError("Укажите стоимость доставки.");
      return;
    }

    const discountValue = discountInput ? Number(discountInput) : 0;

    const dto: CreateDealDto = {
      leadId: selectedLead.id,
      warehouseId: resolvedWarehouseId,
      items,
      discount: discountValue > 0 ? discountValue : undefined,
      requiresVatInvoice: isLegalEntity ? requiresVatInvoice : undefined,
      paymentMethod: paymentMethod || undefined,
      ...(deliveryMethod === "OPTION" ? { deliveryOptionId } : {}),
      ...(deliveryMethod === "QUOTE"
        ? {
            deliveryOptionId: calcSelection?.deliveryOptionId,
            deliveryQuoteId: calcSelection?.deliveryQuoteId,
          }
        : {}),
      ...(deliveryMethod === "MANUAL" ? { deliveryCost: Number(deliveryCostInput) } : {}),
    };

    createDeal.mutate(dto, {
      onSuccess: (deal) => {
        showToast("Сделка создана", "success");
        router.push(`/deals/${deal.id}`);
      },
      onError: (mutationError) => {
        setError(mutationError instanceof Error ? mutationError.message : "Не удалось создать сделку.");
      },
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/deals" className={styles.back}>
          ← Все сделки
        </Link>
        <h1 className={styles.heading}>Новая сделка</h1>
      </div>

      <form className={styles.sections} onSubmit={handleSubmit}>
        <Card>
          <h2 className={styles.sectionTitle}>Лид</h2>
          {lockedLead ? (
            <div className={styles.leadLocked}>
              <div>
                <p className={styles.leadName}>{lockedLead.fullName || lockedLead.phone || "Без имени"}</p>
                <p className={styles.muted}>
                  {BUYER_TYPE_LABEL[lockedLead.buyerType]}
                  {lockedLead.city ? `, ${lockedLead.city}` : ""}
                </p>
              </div>
              <Link href="/deals/new">Сменить</Link>
            </div>
          ) : selectedLead ? (
            <div className={styles.leadLocked}>
              <div>
                <p className={styles.leadName}>{selectedLead.fullName || selectedLead.phone || "Без имени"}</p>
                <p className={styles.muted}>
                  {BUYER_TYPE_LABEL[selectedLead.buyerType]}
                  {selectedLead.city ? `, ${selectedLead.city}` : ""}
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setFreeSelectedLead(null)}>
                Изменить
              </Button>
            </div>
          ) : (
            <LeadSearchPicker onSelect={setFreeSelectedLead} />
          )}
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Товары</h2>
          {productsQuery.isPending ? (
            <Spinner />
          ) : productsQuery.isError ? (
            <StateMessage tone="error" title="Не удалось загрузить товары" description={productsQuery.error.message} />
          ) : (
            <ItemsEditor products={products} items={items} onAddItem={handleAddItem} onRemoveItem={handleRemoveItem} />
          )}
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Условия</h2>
          <div className={formStyles.form}>
            <div className={formStyles.grid2}>
              <Field label="Скидка, ₽" hint={discountHint}>
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="number"
                    min={0}
                    value={discountInput}
                    onChange={(event) => setDiscountInput(event.target.value)}
                  />
                )}
              </Field>
              <Field label="Способ оплаты">
                {(fieldProps) => (
                  <Select
                    {...fieldProps}
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod | "")}
                  >
                    <option value="">Не указан</option>
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {PAYMENT_METHOD_LABEL[method]}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>

            {isLegalEntity ? (
              <Checkbox
                label="Требуется счёт с НДС (наценка юрлицу применится автоматически)"
                checked={requiresVatInvoice}
                onChange={(event) => setRequiresVatInvoice(event.target.checked)}
              />
            ) : null}
          </div>
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Доставка и склад</h2>
          <div className={formStyles.form}>
            <Field label="Способ доставки">
              {(fieldProps) => (
                <Select
                  {...fieldProps}
                  value={deliveryMethod}
                  onChange={(event) => handleDeliveryMethodChange(event.target.value as DeliveryMethod)}
                >
                  <option value="NONE">Без доставки</option>
                  <option value="OPTION">Локальный вариант доставки</option>
                  <option value="QUOTE">По расчёту</option>
                  <option value="MANUAL">Указать вручную</option>
                </Select>
              )}
            </Field>

            {deliveryMethod === "OPTION" ? (
              <Field label="Вариант доставки" required>
                {(fieldProps) =>
                  deliveryOptionsQuery.isPending ? (
                    <Spinner />
                  ) : deliveryOptionsQuery.isError ? (
                    <StateMessage
                      tone="error"
                      title="Не удалось загрузить варианты доставки"
                      description={deliveryOptionsQuery.error.message}
                    />
                  ) : (
                    <Select
                      {...fieldProps}
                      value={deliveryOptionId}
                      onChange={(event) => setDeliveryOptionId(event.target.value)}
                    >
                      <option value="">Выберите вариант</option>
                      {deliveryOptionsQuery.data.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} — {formatCurrency(option.price)}
                        </option>
                      ))}
                    </Select>
                  )
                }
              </Field>
            ) : null}

            {deliveryMethod === "MANUAL" ? (
              <Field label="Стоимость доставки, ₽" required>
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="number"
                    min={0}
                    value={deliveryCostInput}
                    onChange={(event) => setDeliveryCostInput(event.target.value)}
                  />
                )}
              </Field>
            ) : null}

            {deliveryMethod === "QUOTE" ? (
              calcSelection ? (
                <div className={styles.quoteSummary}>
                  <div>
                    <p className={styles.leadName}>{calcSelection.warehouseName}</p>
                    <p className={styles.muted}>{calcSelection.summary}</p>
                  </div>
                  <div className={styles.quoteSummaryActions}>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setCalcModalOpen(true)}>
                      Изменить
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCalcSelection(null)}>
                      Очистить
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCalcModalOpen(true)}
                  disabled={!selectedLead || items.length === 0}
                >
                  Рассчитать доставку
                </Button>
              )
            ) : null}

            {deliveryMethod !== "QUOTE" ? (
              <Field label="Склад отгрузки" required>
                {(fieldProps) =>
                  warehousesQuery.isPending ? (
                    <Spinner />
                  ) : warehousesQuery.isError ? (
                    <StateMessage
                      tone="error"
                      title="Не удалось загрузить склады"
                      description={warehousesQuery.error.message}
                    />
                  ) : (
                    <Select {...fieldProps} value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)}>
                      <option value="">Выберите склад</option>
                      {warehousesQuery.data.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} ({warehouse.city})
                        </option>
                      ))}
                    </Select>
                  )
                }
              </Field>
            ) : (
              <p className={styles.muted}>
                Склад отгрузки будет определён выбранным вариантом доставки в калькуляторе.
              </p>
            )}
          </div>
        </Card>

        {error ? (
          <p role="alert" className={formStyles.error}>
            {error}
          </p>
        ) : null}

        <div className={styles.actions}>
          <Button type="submit" loading={createDeal.isPending}>
            Создать сделку
          </Button>
        </div>
      </form>

      <DeliveryCalcModal
        open={calcModalOpen}
        onClose={() => setCalcModalOpen(false)}
        items={items}
        buyerType={selectedLead?.buyerType ?? "INDIVIDUAL"}
        requiresVatInvoice={requiresVatInvoice}
        onSelect={handleCalcSelect}
      />
    </div>
  );
}

function LeadSearchPicker({ onSelect }: { onSelect: (lead: Lead) => void }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const leadsQuery = useLeadsQuery({ search: search || undefined, limit: 20 });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
  }

  return (
    <div>
      <form className={styles.searchForm} onSubmit={handleSubmit}>
        <Input
          placeholder="Поиск лида по имени, телефону, компании"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          aria-label="Поиск лида"
        />
        <Button type="submit" variant="secondary" size="sm">
          Найти
        </Button>
      </form>

      {leadsQuery.isPending ? (
        <Spinner />
      ) : leadsQuery.isError ? (
        <StateMessage tone="error" title="Не удалось загрузить лиды" description={leadsQuery.error.message} />
      ) : leadsQuery.data.length === 0 ? (
        <StateMessage title="Лиды не найдены" description="Попробуйте изменить запрос." />
      ) : (
        <ul className={styles.leadResults}>
          {leadsQuery.data.map((lead) => (
            <li key={lead.id}>
              <button type="button" className={styles.leadResultButton} onClick={() => onSelect(lead)}>
                <span>{lead.fullName || lead.phone || "Без имени"}</span>
                <span className={styles.muted}>
                  {BUYER_TYPE_LABEL[lead.buyerType]}
                  {lead.city ? `, ${lead.city}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemsEditor({
  products,
  items,
  onAddItem,
  onRemoveItem,
}: {
  products: Product[];
  items: CreateDealItemDto[];
  onAddItem: (item: CreateDealItemDto) => void;
  onRemoveItem: (productId: string) => void;
}) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const productById = new Map(products.map((product) => [product.id, product]));

  function handleAdd() {
    if (!productId || quantity < 1) return;
    onAddItem({ productId, quantity });
    setProductId("");
    setQuantity(1);
  }

  return (
    <div>
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
        <Button type="button" variant="secondary" size="sm" onClick={handleAdd} disabled={!productId}>
          Добавить
        </Button>
      </div>

      {items.length === 0 ? (
        <p className={styles.muted}>Товары не добавлены</p>
      ) : (
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th>Товар</th>
              <th>Кол-во</th>
              <th>Цена</th>
              <th>Сумма</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const product = productById.get(item.productId);
              const unitPrice = product ? Number(product.price) : 0;
              return (
                <tr key={item.productId}>
                  <td>{product?.name ?? item.productId}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(unitPrice)}</td>
                  <td>{formatCurrency(unitPrice * item.quantity)}</td>
                  <td>
                    <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveItem(item.productId)}>
                      Удалить
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
