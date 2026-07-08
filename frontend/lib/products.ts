import { apiGet } from "./api-client";
import type { PagedResponse, ProductDto } from "./types";

// GET /api/products/{id} — one product by id
export function getProduct(id: string) {
  return apiGet<ProductDto>(`/api/products/${id}`);
}

// Filters for the paged list. camelCase here; mapped to the backend's
// snake_case query params below.
export type ProductFilters = {
  category?: string;
  brand?: string;
  budgetMin?: number;
  budgetMax?: number;
  vramMin?: number;
  inStock?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;   // default backend: price_inr
  sortDir?: string;  // asc | desc
};

// GET /api/products?category=&budget_min=&... — paged, filtered catalog
export function getProducts(filters: ProductFilters = {}) {
  const p = new URLSearchParams();
  if (filters.category) p.set("category", filters.category);
  if (filters.brand) p.set("brand", filters.brand);
  if (filters.budgetMin != null) p.set("budget_min", String(filters.budgetMin));
  if (filters.budgetMax != null) p.set("budget_max", String(filters.budgetMax));
  if (filters.vramMin != null) p.set("vram_min", String(filters.vramMin));
  if (filters.inStock != null) p.set("in_stock", String(filters.inStock));
  if (filters.page != null) p.set("page", String(filters.page));
  if (filters.size != null) p.set("size", String(filters.size));
  if (filters.sortBy) p.set("sort_by", filters.sortBy);
  if (filters.sortDir) p.set("sort_dir", filters.sortDir);
  const qs = p.toString();
  return apiGet<PagedResponse<ProductDto>>(`/api/products${qs ? `?${qs}` : ""}`);
}

// GET /api/products/category/{category} — full list, no pagination
export function getProductsByCategory(category: string) {
  return apiGet<ProductDto[]>(`/api/products/category/${encodeURIComponent(category)}`);
}

// GET /api/products/meta/categories — distinct categories (filter sidebar)
export function getCategories() {
  return apiGet<string[]>("/api/products/meta/categories");
}

// GET /api/products/meta/brands?category= — distinct brands, optionally scoped
export function getBrands(category?: string) {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  return apiGet<string[]>(`/api/products/meta/brands${qs}`);
}
