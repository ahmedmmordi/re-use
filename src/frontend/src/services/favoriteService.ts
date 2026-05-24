import type { PagedResult } from "./categoryService";
import type { ProductResponse, ProductType } from "./productService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface FavoritesQuery {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  types?: ProductType[];
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

function buildQuery(query: FavoritesQuery): string {
  const params = new URLSearchParams();
  if (query.pageNumber !== undefined) params.set("Pagination.PageNumber", String(query.pageNumber));
  if (query.pageSize !== undefined) params.set("Pagination.PageSize", String(query.pageSize));
  if (query.searchTerm) params.set("SearchTerm", query.searchTerm);
  if (query.types) query.types.forEach((t) => params.append("Types", t));
  if (query.sortBy) params.set("SortBy", query.sortBy);
  if (query.sortDirection) params.set("SortDirection", query.sortDirection);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function getFavorites(
  query: FavoritesQuery = {}
): Promise<PagedResult<ProductResponse>> {
  const res = await fetch(`${BASE_URL}/favorites${buildQuery(query)}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<PagedResult<ProductResponse>>(res);
}

export async function addToFavorites(productId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/favorites/${productId}`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || "Request failed");
  }
}

export async function removeFromFavorites(productId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/favorites/${productId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || "Request failed");
  }
}
