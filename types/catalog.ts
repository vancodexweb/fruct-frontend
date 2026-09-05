import type { DecimalString, ListQuery } from "./common";

export interface Category {
  id: string;
  name: string;
}

export interface CreateCategoryDto {
  name: string;
}

export interface UpdateCategoryDto {
  name: string;
}

export interface Product {
  id: string;
  categoryId: string | null;
  name: string;
  sku: string | null;
  price: DecimalString;
  costPrice: DecimalString | null;
  weightKg: DecimalString | null;
  specs: unknown;
  imageUrls: string[];
  isActive: boolean;
  createdAt: string;
}

export interface CreateProductDto {
  name: string;
  categoryId?: string;
  sku?: string;
  price: number;
  costPrice?: number;
  weightKg?: number;
  specs?: Record<string, unknown>;
  imageUrls?: string[];
}

export interface UpdateProductDto {
  name?: string;
  categoryId?: string | null;
  sku?: string;
  price?: number;
  costPrice?: number;
  weightKg?: number;
  specs?: Record<string, unknown>;
  imageUrls?: string[];
}

export interface ListProductsQuery extends ListQuery {
  search?: string;
  categoryId?: string;
  includeInactive?: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  city: string;
  address: string | null;
  isActive: boolean;
}

export interface CreateWarehouseDto {
  name: string;
  city: string;
  address?: string;
}

export interface UpdateWarehouseDto {
  name?: string;
  city?: string;
  address?: string;
}

export interface StockProductSummary {
  id: string;
  name: string;
  sku: string | null;
  price: DecimalString;
}

export interface StockWarehouseSummary {
  id: string;
  name: string;
  city: string;
}

export interface Stock {
  id: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  product?: StockProductSummary;
  warehouse?: StockWarehouseSummary;
}

export interface SetStockDto {
  quantity: number;
}

export interface DeliveryOption {
  id: string;
  name: string;
  price: DecimalString;
  etaDays: number | null;
  conditions: string | null;
}

export interface CreateDeliveryOptionDto {
  name: string;
  price: number;
  etaDays?: number;
  conditions?: string;
}

export interface UpdateDeliveryOptionDto {
  name?: string;
  price?: number;
  etaDays?: number;
  conditions?: string;
}
