const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface CategoryResponse {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  isActive: boolean;
  productCount: number;
  subcategories: CategoryResponse[];
}

export interface PagedResult<T> {
  data: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  firstRowOnPage: number;
  lastRowOnPage: number;
}

export interface CategoriesQuery {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  parentId?: string;
  isActive?: boolean;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || "Request failed");
  }
  return res.json() as Promise<T>;
}

export async function getCategoryTree(): Promise<CategoryResponse[]> {
  const res = await fetch(`${BASE_URL}/categories/tree`, {
    method: "GET",
  });
  return handleResponse<CategoryResponse[]>(res);
}

export async function getCategories(
  query: CategoriesQuery = {}
): Promise<PagedResult<CategoryResponse>> {
  const params = new URLSearchParams();
  if (query.pageNumber !== undefined) params.set("Pagination.PageNumber", String(query.pageNumber));
  if (query.pageSize !== undefined) params.set("Pagination.PageSize", String(query.pageSize));
  if (query.searchTerm) params.set("SearchTerm", query.searchTerm);
  if (query.parentId) params.set("ParentId", query.parentId);
  if (query.isActive !== undefined) params.set("IsActive", String(query.isActive));

  const qs = params.toString();
  const url = `${BASE_URL}/categories${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, { method: "GET" });
  return handleResponse<PagedResult<CategoryResponse>>(res);
}

export async function getCategoryById(categoryId: string): Promise<CategoryResponse> {
  const res = await fetch(`${BASE_URL}/categories/${categoryId}`, {
    method: "GET",
  });
  return handleResponse<CategoryResponse>(res);
}

// ─── Admin endpoints ─────────────────────────────────────────────────────────

export async function getAdminCategoryTree(): Promise<CategoryResponse[]> {
  const res = await fetch(`${BASE_URL}/admin/categories/tree`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<CategoryResponse[]>(res);
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  isActive?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  isActive?: boolean | null;
  parentId?: string | null;
}

export async function createCategory(request: CreateCategoryRequest): Promise<CategoryResponse> {
  const res = await fetch(`${BASE_URL}/admin/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });
  return handleResponse<CategoryResponse>(res);
}

export async function updateCategory(
  categoryId: string,
  request: UpdateCategoryRequest
): Promise<CategoryResponse> {
  const res = await fetch(`${BASE_URL}/admin/categories/${categoryId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });
  return handleResponse<CategoryResponse>(res);
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/admin/categories/${categoryId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || "Request failed");
  }
}

export async function uploadCategoryIcon(
  categoryId: string,
  icon: File
): Promise<CategoryResponse> {
  const form = new FormData();
  form.append("icon", icon);

  const res = await fetch(`${BASE_URL}/admin/categories/${categoryId}/icon`, {
    method: "PATCH",
    credentials: "include",
    body: form,
  });
  return handleResponse<CategoryResponse>(res);
}
