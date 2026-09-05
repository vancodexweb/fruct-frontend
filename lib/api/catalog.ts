import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type {
  Category,
  CreateCategoryDto,
  CreateDeliveryOptionDto,
  CreateProductDto,
  CreateWarehouseDto,
  DeliveryOption,
  ListProductsQuery,
  Product,
  SetStockDto,
  Stock,
  UpdateCategoryDto,
  UpdateDeliveryOptionDto,
  UpdateProductDto,
  UpdateWarehouseDto,
  Warehouse,
} from "@/types/catalog";
import { clientApiFetch } from "./client-fetcher";
import { toQueryString, type Fetcher } from "./core";

export const catalogKeys = {
  categories: () => ["catalog", "categories"] as const,
  products: (params?: ListProductsQuery) => ["catalog", "products", params ?? {}] as const,
  product: (id: string) => ["catalog", "products", "detail", id] as const,
  warehouses: (includeInactive?: boolean) => ["catalog", "warehouses", { includeInactive }] as const,
  stockByWarehouse: (warehouseId: string) => ["catalog", "stock", "warehouse", warehouseId] as const,
  stockByProduct: (productId: string) => ["catalog", "stock", "product", productId] as const,
  deliveryOptions: () => ["catalog", "delivery-options"] as const,
};

// ---- categories ----

export function listCategories(fetcher: Fetcher): Promise<Category[]> {
  return fetcher<Category[]>("/categories");
}

function createCategory(dto: CreateCategoryDto): Promise<Category> {
  return clientApiFetch<Category>("/categories", { method: "POST", body: JSON.stringify(dto) });
}

function updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
  return clientApiFetch<Category>(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(dto) });
}

function deleteCategory(id: string): Promise<void> {
  return clientApiFetch<void>(`/categories/${id}`, { method: "DELETE" });
}

export function useCategoriesQuery(options?: { initialData?: Category[] }): UseQueryResult<Category[], Error> {
  return useQuery({
    queryKey: catalogKeys.categories(),
    queryFn: () => listCategories(clientApiFetch),
    initialData: options?.initialData,
    staleTime: 5 * 60_000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: catalogKeys.categories() }),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCategoryDto }) => updateCategory(id, dto),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: catalogKeys.categories() }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: catalogKeys.categories() });
      void queryClient.invalidateQueries({ queryKey: ["catalog", "products"] });
    },
  });
}

// ---- products ----

export function listProducts(fetcher: Fetcher, params?: ListProductsQuery): Promise<Product[]> {
  return fetcher<Product[]>(`/products${toQueryString(params as Record<string, unknown>)}`);
}

export function getProduct(fetcher: Fetcher, id: string): Promise<Product> {
  return fetcher<Product>(`/products/${id}`);
}

function createProduct(dto: CreateProductDto): Promise<Product> {
  return clientApiFetch<Product>("/products", { method: "POST", body: JSON.stringify(dto) });
}

function updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
  return clientApiFetch<Product>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(dto) });
}

function deactivateProduct(id: string): Promise<Product> {
  return clientApiFetch<Product>(`/products/${id}/deactivate`, { method: "PATCH" });
}

function reactivateProduct(id: string): Promise<Product> {
  return clientApiFetch<Product>(`/products/${id}/reactivate`, { method: "PATCH" });
}

export function useProductsQuery(
  params?: ListProductsQuery,
  options?: { initialData?: Product[] },
): UseQueryResult<Product[], Error> {
  return useQuery({
    queryKey: catalogKeys.products(params),
    queryFn: () => listProducts(clientApiFetch, params),
    initialData: options?.initialData,
    staleTime: 60_000,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["catalog", "products"] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProductDto }) => updateProduct(id, dto),
    onSuccess: (product) => {
      queryClient.setQueryData(catalogKeys.product(product.id), product);
      void queryClient.invalidateQueries({ queryKey: ["catalog", "products"] });
    },
  });
}

export function useSetProductActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? reactivateProduct(id) : deactivateProduct(id),
    onSuccess: (product) => {
      queryClient.setQueryData(catalogKeys.product(product.id), product);
      void queryClient.invalidateQueries({ queryKey: ["catalog", "products"] });
    },
  });
}

// ---- warehouses ----

export function listWarehouses(fetcher: Fetcher, includeInactive?: boolean): Promise<Warehouse[]> {
  return fetcher<Warehouse[]>(`/warehouses${toQueryString({ includeInactive })}`);
}

function createWarehouse(dto: CreateWarehouseDto): Promise<Warehouse> {
  return clientApiFetch<Warehouse>("/warehouses", { method: "POST", body: JSON.stringify(dto) });
}

function updateWarehouse(id: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
  return clientApiFetch<Warehouse>(`/warehouses/${id}`, { method: "PATCH", body: JSON.stringify(dto) });
}

function deactivateWarehouse(id: string): Promise<Warehouse> {
  return clientApiFetch<Warehouse>(`/warehouses/${id}/deactivate`, { method: "PATCH" });
}

function reactivateWarehouse(id: string): Promise<Warehouse> {
  return clientApiFetch<Warehouse>(`/warehouses/${id}/reactivate`, { method: "PATCH" });
}

export function useWarehousesQuery(
  includeInactive?: boolean,
  options?: { initialData?: Warehouse[] },
): UseQueryResult<Warehouse[], Error> {
  return useQuery({
    queryKey: catalogKeys.warehouses(includeInactive),
    queryFn: () => listWarehouses(clientApiFetch, includeInactive),
    initialData: options?.initialData,
    staleTime: 5 * 60_000,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["catalog", "warehouses"] }),
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateWarehouseDto }) => updateWarehouse(id, dto),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["catalog", "warehouses"] }),
  });
}

export function useSetWarehouseActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? reactivateWarehouse(id) : deactivateWarehouse(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["catalog", "warehouses"] }),
  });
}

// ---- stock ----

export function listStockByWarehouse(fetcher: Fetcher, warehouseId: string): Promise<Stock[]> {
  return fetcher<Stock[]>(`/warehouses/${warehouseId}/stock`);
}

export function listStockByProduct(fetcher: Fetcher, productId: string): Promise<Stock[]> {
  return fetcher<Stock[]>(`/products/${productId}/stock`);
}

function setStock(warehouseId: string, productId: string, dto: SetStockDto): Promise<Stock> {
  return clientApiFetch<Stock>(`/warehouses/${warehouseId}/stock/${productId}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export function useStockByWarehouseQuery(
  warehouseId: string,
  options?: { initialData?: Stock[] },
): UseQueryResult<Stock[], Error> {
  return useQuery({
    queryKey: catalogKeys.stockByWarehouse(warehouseId),
    queryFn: () => listStockByWarehouse(clientApiFetch, warehouseId),
    initialData: options?.initialData,
    staleTime: 30_000,
    enabled: Boolean(warehouseId),
  });
}

export function useSetStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      warehouseId,
      productId,
      dto,
    }: {
      warehouseId: string;
      productId: string;
      dto: SetStockDto;
    }) => setStock(warehouseId, productId, dto),
    onSuccess: (_stock, variables) => {
      void queryClient.invalidateQueries({ queryKey: catalogKeys.stockByWarehouse(variables.warehouseId) });
      void queryClient.invalidateQueries({ queryKey: catalogKeys.stockByProduct(variables.productId) });
    },
  });
}

// ---- delivery options ----

export function listDeliveryOptions(fetcher: Fetcher): Promise<DeliveryOption[]> {
  return fetcher<DeliveryOption[]>("/delivery-options");
}

function createDeliveryOption(dto: CreateDeliveryOptionDto): Promise<DeliveryOption> {
  return clientApiFetch<DeliveryOption>("/delivery-options", { method: "POST", body: JSON.stringify(dto) });
}

function updateDeliveryOption(id: string, dto: UpdateDeliveryOptionDto): Promise<DeliveryOption> {
  return clientApiFetch<DeliveryOption>(`/delivery-options/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

function deleteDeliveryOption(id: string): Promise<void> {
  return clientApiFetch<void>(`/delivery-options/${id}`, { method: "DELETE" });
}

export function useDeliveryOptionsQuery(options?: {
  initialData?: DeliveryOption[];
}): UseQueryResult<DeliveryOption[], Error> {
  return useQuery({
    queryKey: catalogKeys.deliveryOptions(),
    queryFn: () => listDeliveryOptions(clientApiFetch),
    initialData: options?.initialData,
    staleTime: 5 * 60_000,
  });
}

export function useCreateDeliveryOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeliveryOption,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: catalogKeys.deliveryOptions() }),
  });
}

export function useUpdateDeliveryOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDeliveryOptionDto }) => updateDeliveryOption(id, dto),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: catalogKeys.deliveryOptions() }),
  });
}

export function useDeleteDeliveryOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDeliveryOption,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: catalogKeys.deliveryOptions() }),
  });
}
