"use client";

import { useState } from "react";
import type { Category, DeliveryOption, Product, Warehouse } from "@/types/catalog";
import { CategoriesTab } from "./CategoriesTab";
import { ProductsTab } from "./ProductsTab";
import { WarehousesTab } from "./WarehousesTab";
import { DeliveryOptionsTab } from "./DeliveryOptionsTab";
import styles from "./catalog.module.css";

type TabKey = "categories" | "products" | "warehouses" | "delivery-options";

const TABS: { key: TabKey; label: string }[] = [
  { key: "products", label: "Товары" },
  { key: "categories", label: "Категории" },
  { key: "warehouses", label: "Склады" },
  { key: "delivery-options", label: "Условия доставки" },
];

interface CatalogViewProps {
  initialCategories: Category[];
  initialProducts: Product[];
  initialWarehouses: Warehouse[];
  initialDeliveryOptions: DeliveryOption[];
}

export function CatalogView({
  initialCategories,
  initialProducts,
  initialWarehouses,
  initialDeliveryOptions,
}: CatalogViewProps) {
  const [tab, setTab] = useState<TabKey>("products");

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Каталог</h1>

      <div className={styles.tabs} role="tablist" aria-label="Разделы каталога">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            id={`catalog-tab-${item.key}`}
            aria-selected={tab === item.key}
            aria-controls={`catalog-panel-${item.key}`}
            className={[styles.tab, tab === item.key ? styles.tabActive : ""].join(" ")}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`catalog-panel-${tab}`} aria-labelledby={`catalog-tab-${tab}`}>
        {tab === "products" ? (
          <ProductsTab initialProducts={initialProducts} initialCategories={initialCategories} />
        ) : tab === "categories" ? (
          <CategoriesTab initialCategories={initialCategories} />
        ) : tab === "warehouses" ? (
          <WarehousesTab initialWarehouses={initialWarehouses} />
        ) : (
          <DeliveryOptionsTab initialDeliveryOptions={initialDeliveryOptions} />
        )}
      </div>
    </div>
  );
}
