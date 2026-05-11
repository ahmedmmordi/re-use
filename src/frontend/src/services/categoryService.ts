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
