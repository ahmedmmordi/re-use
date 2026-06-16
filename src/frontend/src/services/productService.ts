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
  status: ProductStatus;
  createdAt: string;
  price: number | null;
  allowNegotiation: boolean;
  wantedItem: string | null;
  wantedItemDescription: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  images: ProductImage[];
  coverImageUrl: string;
  isPremium: boolean;
  premiumExpiresAt: string | null;
  sellerName: string;
  sellerAvatarUrl: string | null;
  favoritesCount: number;
  categoryName: string;
}

export interface ProductDetailsResponse {
  id: string;
  title: string;
  description: string;
  type: ProductType;
  condition: string | null;
  status: string;
  locationCity: string | null;
  locationCountry: string | null;
  price: number | null;
  allowNegotiation: boolean | null;
  wantedItemTitle: string | null;
  wantedItemDescription: string | null;
  wantedCondition: string | null;
  desiredPriceMin: number | null;
  desiredPriceMax: number | null;
  images: string[];
  createdAt: string;
  categoryId: string;
  categoryName: string;
  ownerUserId: string;
  ownerUserName: string;
  ownerProfileImageUrl: string | null;
  memberSince: string;
  ownerRatingsAverage: number;
  ownerRatingsCount: number;
  ownerIsVerified: boolean;
  isPremium: boolean;
  premiumExpiresAt: string | null;
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
  isPremium?: boolean;
  sortBy?: "Relevance" | "Newest" | "Price";
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
  if (query.isPremium !== undefined) params.set("IsPremium", String(query.isPremium));
  if (query.sortBy) params.set("SortBy", query.sortBy);
  if (query.sortDirection) params.set("SortDirection", query.sortDirection);

  const qs = params.toString();
  const url = `${BASE_URL}/Product${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, { method: "GET" });
  return handleResponse<PagedResult<ProductResponse>>(res);
}

export async function getProductDetails(productId: string): Promise<ProductDetailsResponse> {
  const res = await fetch(`${BASE_URL}/Product/${productId}`, {
    method: "GET",
  });
  return handleResponse<ProductDetailsResponse>(res);
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
  if (query.isPremium !== undefined) params.set("IsPremium", String(query.isPremium));
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
  if (query.isPremium !== undefined) params.set("IsPremium", String(query.isPremium));
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

export interface PremiumPriceResponse {
  durationDays: number;
  amount: number;
  currency: string;
}

/** GET /api/Product/premium/price — price quote for a premium duration. */
export async function getPremiumPrice(durationDays: number): Promise<PremiumPriceResponse> {
  const res = await fetch(`${BASE_URL}/Product/premium/price?DurationDays=${durationDays}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<PremiumPriceResponse>(res);
}

/** POST /api/Product/{productId}/premium — start premium payment, returns Paymob payment URL. */
export async function makePremium(
  productId: string,
  durationDays: number
): Promise<{ paymentUrl: string }> {
  const res = await fetch(`${BASE_URL}/Product/${productId}/premium`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ durationDays }),
  });
  return handleResponse<{ paymentUrl: string }>(res);
}

/** DELETE /api/Product/{productId} — delete own listing. */
export async function deleteProduct(productId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/Product/${productId}`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleEmptyResponse(res);
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

// ─── Admin endpoints ─────────────────────────────────────────────────────────

export interface AdminProductsQuery {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  categoryIds?: string[];
  statuses?: ProductStatus[];
  types?: ProductType[];
  conditions?: ProductCondition[];
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  isPremium?: boolean;
  sortBy?: "Newest" | "Price";
  sortDirection?: "Asc" | "Desc";
}

export interface AdminProductsSummaryResponse {
  totalProducts: number;
  activeCount: number;
  soldCount: number;
  closedCount: number;
  deletedCount: number;
  underReviewCount: number;
}

export async function getAdminProducts(
  query: AdminProductsQuery = {}
): Promise<PagedResult<ProductResponse>> {
  const params = new URLSearchParams();
  if (query.pageNumber !== undefined) params.set("Pagination.PageNumber", String(query.pageNumber));
  if (query.pageSize !== undefined) params.set("Pagination.PageSize", String(query.pageSize));
  if (query.searchTerm) params.set("SearchTerm", query.searchTerm);
  if (query.categoryIds) query.categoryIds.forEach((id) => params.append("CategoryIds", id));
  if (query.statuses) query.statuses.forEach((s) => params.append("Statuses", s));
  if (query.types) query.types.forEach((t) => params.append("Types", t));
  if (query.conditions) query.conditions.forEach((c) => params.append("Conditions", c));
  if (query.minPrice !== undefined) params.set("MinPrice", String(query.minPrice));
  if (query.maxPrice !== undefined) params.set("MaxPrice", String(query.maxPrice));
  if (query.location) params.set("Location", query.location);
  if (query.isPremium !== undefined) params.set("IsPremium", String(query.isPremium));
  if (query.sortBy) params.set("SortBy", query.sortBy);
  if (query.sortDirection) params.set("SortDirection", query.sortDirection);

  const qs = params.toString();
  const url = `${BASE_URL}/admin/products${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, { method: "GET", credentials: "include" });
  return handleResponse<PagedResult<ProductResponse>>(res);
}

export async function getAdminProductsSummary(): Promise<AdminProductsSummaryResponse> {
  const res = await fetch(`${BASE_URL}/admin/products/summary`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<AdminProductsSummaryResponse>(res);
}

async function handleEmptyResponse(res: Response): Promise<void> {
  if (res.ok) return;
  const errorData = await res.json().catch(() => ({ message: "Request failed" }));
  throw new Error(errorData.message || "Request failed");
}

export async function deleteAdminProduct(productId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/admin/products/${productId}`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleEmptyResponse(res);
}

export async function restoreAdminProduct(productId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/admin/products/${productId}/restore`, {
    method: "PATCH",
    credentials: "include",
  });
  await handleEmptyResponse(res);
}

export async function changeAdminProductStatus(
  productId: string,
  status: ProductStatus
): Promise<void> {
  const res = await fetch(`${BASE_URL}/admin/products/${productId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  await handleEmptyResponse(res);
}

export async function setAdminProductPremium(
  productId: string,
  durationDays: number
): Promise<void> {
  const res = await fetch(`${BASE_URL}/admin/products/${productId}/premium`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ durationDays }),
  });
  await handleEmptyResponse(res);
}

export async function removeAdminProductPremium(productId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/admin/products/${productId}/premium`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleEmptyResponse(res);
}
