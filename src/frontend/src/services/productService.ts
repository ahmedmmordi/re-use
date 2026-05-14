import type { PagedResult } from "./categoryService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type ProductType = "Regular" | "Wanted" | "Swap";
export type ProductCondition = "New" | "LikeNew" | "Used" | "Broken";

export interface ProductImage {
  id: string;
  url: string;
  displayOrder: number;
  type: string;
}

export interface ProductResponse {
  id: string;
  type: ProductType;
  title: string;
  description: string;
  categoryId: string;
  condition: ProductCondition | null;
  locationCity: string | null;
  locationCountry: string | null;
  ownerUserId: string;
  createdAt: string;
  price: number | null;
  allowNegotiation: boolean;
  wantedItem: string | null;
  wantedItemDescription: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  images: ProductImage[];
  coverImageUrl: string;
}

export interface ProductsQuery {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  categoryIds?: string[];
  types?: ProductType[];
  conditions?: ProductCondition[];
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  sortBy?: "Newest" | "Price";
  sortDirection?: "Asc" | "Desc";
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || "Request failed");
  }
  return res.json() as Promise<T>;
}

export async function listProducts(
  query: ProductsQuery = {}
): Promise<PagedResult<ProductResponse>> {
  const params = new URLSearchParams();
  if (query.pageNumber !== undefined) params.set("Pagination.PageNumber", String(query.pageNumber));
  if (query.pageSize !== undefined) params.set("Pagination.PageSize", String(query.pageSize));
  if (query.searchTerm) params.set("SearchTerm", query.searchTerm);
  if (query.categoryIds) query.categoryIds.forEach((id) => params.append("CategoryIds", id));
  if (query.types) query.types.forEach((t) => params.append("Types", t));
  if (query.conditions) query.conditions.forEach((c) => params.append("Conditions", c));
  if (query.minPrice !== undefined) params.set("MinPrice", String(query.minPrice));
  if (query.maxPrice !== undefined) params.set("MaxPrice", String(query.maxPrice));
  if (query.location) params.set("Location", query.location);
  if (query.sortBy) params.set("SortBy", query.sortBy);
  if (query.sortDirection) params.set("SortDirection", query.sortDirection);

  const qs = params.toString();
  const url = `${BASE_URL}/Product${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, { method: "GET" });
  return handleResponse<PagedResult<ProductResponse>>(res);
}

export async function getProductById(productId: string): Promise<ProductResponse> {
  const res = await fetch(`${BASE_URL}/Product/${productId}`, {
    method: "GET",
  });
  return handleResponse<ProductResponse>(res);
}
