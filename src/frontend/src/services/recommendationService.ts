import type { PagedResult } from "./categoryService";
import type { ProductResponse } from "./productService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface RecommendationsQuery {
  pageNumber?: number;
  pageSize?: number;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || "Request failed");
  }
  return res.json() as Promise<T>;
}

/** GET /api/recommendations/feed — personalised when authenticated, popular otherwise. */
export async function getRecommendationFeed(
  query: RecommendationsQuery = {}
): Promise<PagedResult<ProductResponse>> {
  const params = new URLSearchParams();
  if (query.pageNumber !== undefined) params.set("PageNumber", String(query.pageNumber));
  if (query.pageSize !== undefined) params.set("PageSize", String(query.pageSize));

  const qs = params.toString();
  const url = `${BASE_URL}/recommendations/feed${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, { method: "GET", credentials: "include" });
  return handleResponse<PagedResult<ProductResponse>>(res);
}
