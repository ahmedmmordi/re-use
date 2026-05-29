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

export type ProductStatus = "Active" | "Sold" | "Closed" | "Deleted" | "UnderReview";

export interface MyListingsQuery extends ProductsQuery {
  status?: ProductStatus;
}

export interface SellerSummaryResponse {
  totalProducts: number;
  activeCount: number;
  soldCount: number;
}

export interface SellerDashboardResponse {
  summary: SellerSummaryResponse;
  products: ProductResponse[];
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

export async function getProductsByUser(
  userId: string,
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
  const url = `${BASE_URL}/Product/${userId}/products${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, { method: "GET" });
  return handleResponse<PagedResult<ProductResponse>>(res);
}

/** GET /api/Product/me — authenticated user's listings with seller summary. */
export async function getMyListings(query: MyListingsQuery = {}): Promise<SellerDashboardResponse> {
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
  if (query.status) params.set("Status", query.status);

  const qs = params.toString();
  const url = `${BASE_URL}/Product/me${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<SellerDashboardResponse>(res);
}

// ─── Create endpoints ──────────────────────────────────────────────────────

export interface CreateRegularProductRequest {
  title: string;
  description: string;
  categoryId: string;
  condition: ProductCondition;
  locationCity?: string;
  locationCountry?: string;
  price: number;
  allowNegotiation: boolean;
  images: File[];
}

export interface CreateWantedProductRequest {
  title: string;
  description: string;
  categoryId: string;
  condition: ProductCondition;
  locationCity?: string;
  locationCountry?: string;
  desiredPriceMin: number;
  desiredPriceMax: number;
  images: File[];
}

export interface CreateSwapProductRequest {
  title: string;
  description: string;
  categoryId: string;
  condition: ProductCondition;
  locationCity?: string;
  locationCountry?: string;
  wantedItemTitle: string;
  wantedItemDescription: string;
  offerImages: File[];
  wantedImages?: File[];
}

export async function createRegularProduct(
  req: CreateRegularProductRequest
): Promise<ProductResponse> {
  const form = new FormData();
  form.append("BasicInfo.Title", req.title);
  form.append("BasicInfo.Description", req.description);
  form.append("BasicInfo.CategoryId", req.categoryId);
  form.append("BasicInfo.Condition", req.condition);
  if (req.locationCity) form.append("BasicInfo.LocationCity", req.locationCity);
  if (req.locationCountry) form.append("BasicInfo.LocationCountry", req.locationCountry);
  form.append("Price", String(req.price));
  form.append("AllowNegotiation", String(req.allowNegotiation));
  req.images.forEach((f) => form.append("Images", f));

  const res = await fetch(`${BASE_URL}/Product/regular`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  return handleResponse<ProductResponse>(res);
}

export async function createWantedProduct(
  req: CreateWantedProductRequest
): Promise<ProductResponse> {
  const form = new FormData();
  form.append("BasicInfo.Title", req.title);
  form.append("BasicInfo.Description", req.description);
  form.append("BasicInfo.CategoryId", req.categoryId);
  form.append("BasicInfo.Condition", req.condition);
  if (req.locationCity) form.append("BasicInfo.LocationCity", req.locationCity);
  if (req.locationCountry) form.append("BasicInfo.LocationCountry", req.locationCountry);
  form.append("DesiredPriceMin", String(req.desiredPriceMin));
  form.append("DesiredPriceMax", String(req.desiredPriceMax));
  req.images.forEach((f) => form.append("Images", f));

  const res = await fetch(`${BASE_URL}/Product/wanted`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  return handleResponse<ProductResponse>(res);
}

export async function createSwapProduct(req: CreateSwapProductRequest): Promise<ProductResponse> {
  const form = new FormData();
  form.append("BasicInfo.Title", req.title);
  form.append("BasicInfo.Description", req.description);
  form.append("BasicInfo.CategoryId", req.categoryId);
  form.append("BasicInfo.Condition", req.condition);
  if (req.locationCity) form.append("BasicInfo.LocationCity", req.locationCity);
  if (req.locationCountry) form.append("BasicInfo.LocationCountry", req.locationCountry);
  form.append("WantedItemTitle", req.wantedItemTitle);
  form.append("WantedItemDescription", req.wantedItemDescription);
  req.offerImages.forEach((f) => form.append("OfferImages", f));
  req.wantedImages?.forEach((f) => form.append("WantedImages", f));

  const res = await fetch(`${BASE_URL}/Product/swap`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  return handleResponse<ProductResponse>(res);
}
