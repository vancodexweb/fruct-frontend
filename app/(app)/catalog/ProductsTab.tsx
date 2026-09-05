"use client";

import { useState, type FormEvent } from "react";
import type { Category, CreateProductDto, ListProductsQuery, Product, UpdateProductDto } from "@/types/catalog";
import { useCategoriesQuery, useCreateProduct, useProductsQuery, useSetProductActive, useUpdateProduct } from "@/lib/api/catalog";
import { useSession } from "@/lib/session/SessionContext";
import { Card } from "@/components/ui/card/Card";
import { Table, type TableColumn } from "@/components/ui/table/Table";
import { Button } from "@/components/ui/button/Button";
import { Input } from "@/components/ui/input/Input";
import { Textarea } from "@/components/ui/textarea/Textarea";
import { Select } from "@/components/ui/select/Select";
import { Checkbox } from "@/components/ui/checkbox/Checkbox";
import { Modal } from "@/components/ui/modal/Modal";
import { Field } from "@/components/ui/field/Field";
import { Badge } from "@/components/ui/badge/Badge";
import { Pagination } from "@/components/ui/pagination/Pagination";
import { Spinner } from "@/components/ui/spinner/Spinner";
import { StateMessage } from "@/components/ui/state/StateMessage";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { formatCurrency } from "@/lib/format/number";
import formStyles from "../form.module.css";
import styles from "./catalog.module.css";

interface ProductsTabProps {
  initialProducts: Product[];
  initialCategories: Category[];
}

type ModalState = { mode: "create" } | { mode: "edit"; product: Product };

const PRODUCTS_LIMIT = 20;

export function ProductsTab({ initialProducts, initialCategories }: ProductsTabProps) {
  const session = useSession();
  const isOwner = session.role === "OWNER";

  const categoriesQuery = useCategoriesQuery({ initialData: initialCategories });
  const categories = categoriesQuery.data ?? [];
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [offset, setOffset] = useState(0);
  const [modalState, setModalState] = useState<ModalState | null>(null);

  const params: ListProductsQuery = {
    search: search || undefined,
    categoryId: categoryId || undefined,
    includeInactive: includeInactive || undefined,
    limit: PRODUCTS_LIMIT,
    offset,
  };
  const isDefaultQuery = !search && !categoryId && !includeInactive && offset === 0;
  const productsQuery = useProductsQuery(params, { initialData: isDefaultQuery ? initialProducts : undefined });

  const setActive = useSetProductActive();

  function resetToFirstPage() {
    setOffset(0);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
    resetToFirstPage();
  }

  const columns: TableColumn<Product>[] = [
    { key: "name", header: "Название", render: (product) => product.name },
    { key: "sku", header: "Артикул", render: (product) => product.sku ?? "—" },
    {
      key: "category",
      header: "Категория",
      render: (product) => (product.categoryId ? (categoryNameById.get(product.categoryId) ?? "—") : "Без категории"),
    },
    { key: "price", header: "Цена", align: "right", render: (product) => formatCurrency(product.price) },
    {
      key: "status",
      header: "Статус",
      render: (product) => (
        <Badge tone={product.isActive ? "success" : "neutral"}>{product.isActive ? "Активен" : "Неактивен"}</Badge>
      ),
    },
    ...(isOwner
      ? ([
          {
            key: "actions",
            header: "",
            align: "right",
            render: (product: Product) => {
              const isTogglingThis = setActive.isPending && setActive.variables?.id === product.id;
              return (
                <div className={styles.rowActions}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setModalState({ mode: "edit", product })}
                  >
                    Редактировать
                  </Button>
                  <Button
                    type="button"
                    variant={product.isActive ? "danger" : "secondary"}
                    size="sm"
                    loading={isTogglingThis}
                    onClick={() => setActive.mutate({ id: product.id, active: !product.isActive })}
                  >
                    {product.isActive ? "Деактивировать" : "Активировать"}
                  </Button>
                </div>
              );
            },
          },
        ] satisfies TableColumn<Product>[])
      : []),
  ];

  return (
    <Card>
      <div className={styles.tabHeader}>
        <h2 className={styles.tabTitle}>Товары</h2>
        {isOwner ? (
          <Button type="button" onClick={() => setModalState({ mode: "create" })}>
            + Товар
          </Button>
        ) : null}
      </div>

      <div className={styles.filters}>
        <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
          <Input
            placeholder="Поиск по названию, артикулу, характеристикам"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Поиск товаров"
          />
          <Button type="submit" variant="secondary" size="sm">
            Найти
          </Button>
        </form>

        <Select
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            resetToFirstPage();
          }}
          aria-label="Фильтр по категории"
        >
          <option value="">Все категории</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        <Checkbox
          label="Показать неактивные"
          checked={includeInactive}
          onChange={(event) => {
            setIncludeInactive(event.target.checked);
            resetToFirstPage();
          }}
        />
      </div>

      {productsQuery.isPending ? (
        <Spinner />
      ) : productsQuery.isError ? (
        <StateMessage tone="error" title="Не удалось загрузить товары" description={productsQuery.error.message} />
      ) : productsQuery.data.length === 0 ? (
        <StateMessage title="Товары не найдены" description="Попробуйте изменить фильтры или добавьте новый товар." />
      ) : (
        <>
          <Table columns={columns} rows={productsQuery.data} rowKey={(product) => product.id} />
          <Pagination
            offset={offset}
            limit={PRODUCTS_LIMIT}
            currentCount={productsQuery.data.length}
            onPrev={() => setOffset((value) => Math.max(0, value - PRODUCTS_LIMIT))}
            onNext={() => setOffset((value) => value + PRODUCTS_LIMIT)}
          />
        </>
      )}

      {modalState ? (
        <ProductFormModal state={modalState} categories={categories} onClose={() => setModalState(null)} />
      ) : null}
    </Card>
  );
}

interface ProductFormState {
  name: string;
  categoryId: string;
  sku: string;
  price: string;
  costPrice: string;
  weightKg: string;
  imageUrls: string;
  specs: string;
}

function emptyProductForm(): ProductFormState {
  return { name: "", categoryId: "", sku: "", price: "", costPrice: "", weightKg: "", imageUrls: "", specs: "{}" };
}

function productToForm(product: Product): ProductFormState {
  return {
    name: product.name,
    categoryId: product.categoryId ?? "",
    sku: product.sku ?? "",
    price: product.price,
    costPrice: product.costPrice ?? "",
    weightKg: product.weightKg ?? "",
    imageUrls: product.imageUrls.join("\n"),
    specs: JSON.stringify(product.specs ?? {}, null, 2),
  };
}

function ProductFormModal({
  state,
  categories,
  onClose,
}: {
  state: ModalState;
  categories: Category[];
  onClose: () => void;
}) {
  const { showToast } = useToast();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEdit = state.mode === "edit";
  const [form, setForm] = useState<ProductFormState>(isEdit ? productToForm(state.product) : emptyProductForm());
  const [error, setError] = useState<string | null>(null);

  const pending = createProduct.isPending || updateProduct.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setError("Введите название товара.");
      return;
    }

    const priceNum = Number(form.price);
    if (form.price.trim() === "" || Number.isNaN(priceNum) || priceNum < 0) {
      setError("Укажите корректную цену товара.");
      return;
    }

    const costPriceNum = form.costPrice.trim() ? Number(form.costPrice) : undefined;
    if (costPriceNum !== undefined && Number.isNaN(costPriceNum)) {
      setError("Себестоимость должна быть числом.");
      return;
    }

    const weightKgNum = form.weightKg.trim() ? Number(form.weightKg) : undefined;
    if (weightKgNum !== undefined && Number.isNaN(weightKgNum)) {
      setError("Вес должен быть числом.");
      return;
    }

    let specs: Record<string, unknown>;
    try {
      const raw: unknown = form.specs.trim() ? JSON.parse(form.specs) : {};
      if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
        throw new Error("specs must be an object");
      }
      specs = raw as Record<string, unknown>;
    } catch {
      setError("Характеристики: некорректный JSON");
      return;
    }

    const imageUrls = form.imageUrls
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const sku = form.sku.trim() || undefined;

    if (isEdit) {
      const dto: UpdateProductDto = {
        name: trimmedName,
        categoryId: form.categoryId || null,
        sku,
        price: priceNum,
        costPrice: costPriceNum,
        weightKg: weightKgNum,
        specs,
        imageUrls,
      };
      updateProduct.mutate(
        { id: state.product.id, dto },
        {
          onSuccess: () => {
            showToast("Товар обновлён", "success");
            onClose();
          },
          onError: (mutationError) => {
            setError(mutationError instanceof Error ? mutationError.message : "Не удалось сохранить товар.");
          },
        },
      );
    } else {
      const dto: CreateProductDto = {
        name: trimmedName,
        categoryId: form.categoryId || undefined,
        sku,
        price: priceNum,
        costPrice: costPriceNum,
        weightKg: weightKgNum,
        specs,
        imageUrls,
      };
      createProduct.mutate(dto, {
        onSuccess: () => {
          showToast("Товар создан", "success");
          onClose();
        },
        onError: (mutationError) => {
          setError(mutationError instanceof Error ? mutationError.message : "Не удалось создать товар.");
        },
      });
    }
  }

  const footer = (
    <>
      <Button type="button" variant="secondary" onClick={onClose}>
        Отмена
      </Button>
      <Button type="submit" form="product-form" loading={pending}>
        {isEdit ? "Сохранить" : "Создать"}
      </Button>
    </>
  );

  return (
    <Modal open onClose={onClose} title={isEdit ? "Редактировать товар" : "Новый товар"} size="lg" footer={footer}>
      <form className={formStyles.form} id="product-form" onSubmit={handleSubmit}>
        <div className={formStyles.grid2}>
          <Field label="Название" required>
            {(fieldProps) => (
              <Input {...fieldProps} autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            )}
          </Field>
          <Field label="Категория">
            {(fieldProps) => (
              <Select {...fieldProps} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Без категории</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <div className={formStyles.grid2}>
          <Field label="Артикул (SKU)">
            {(fieldProps) => <Input {...fieldProps} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />}
          </Field>
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
        </div>

        <div className={formStyles.grid2}>
          <Field label="Себестоимость, ₽">
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="number"
                min={0}
                step="0.01"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              />
            )}
          </Field>
          <Field label="Вес, кг">
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="number"
                min={0}
                step="0.01"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
              />
            )}
          </Field>
        </div>

        <Field label="Ссылки на изображения" hint="По одной ссылке на строку.">
          {(fieldProps) => (
            <Textarea
              {...fieldProps}
              rows={3}
              value={form.imageUrls}
              onChange={(e) => setForm({ ...form, imageUrls: e.target.value })}
            />
          )}
        </Field>

        <Field
          label="Характеристики (JSON)"
          hint='Например: {"material": "экокожа", "color": "чёрный", "maxLoadKg": 150}'
        >
          {(fieldProps) => (
            <Textarea
              {...fieldProps}
              rows={5}
              value={form.specs}
              onChange={(e) => setForm({ ...form, specs: e.target.value })}
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
