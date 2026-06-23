const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type DealStatus = "Pending" | "Accepted" | "Rejected" | "Completed";
export type DealType = "DirectPurchase" | "NegotiatedPurchase" | "Swap" | "WantedOffer";
export type DealAction = "Accept" | "Reject";

export interface DealParticipantDto {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface DealResponse {
  id: string;
  conversationId: string;
  productId: string;
  proposer: DealParticipantDto;
  receiver: DealParticipantDto;
  agreedPrice: number | null;
  dealType: DealType;
  status: DealStatus;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface CreateDealRequest {
  agreedPrice?: number | null;
  notes?: string | null;
}

export interface RespondToDealRequest {
  action: DealAction;
}

export interface ProductDealsResponse {
  productId: string;
  deals: DealResponse[];
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || "Request failed");
  }
  return res.json() as Promise<T>;
}

/** POST /api/conversations/{conversationId}/deals — Proposes a deal inside a conversation */
export async function createDeal(
  conversationId: string,
  request: CreateDealRequest
): Promise<DealResponse> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/deals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });
  return handleResponse<DealResponse>(res);
}

/** PATCH /api/deals/{dealId}/status — Accept or Reject a Pending deal */
export async function respondToDeal(
  dealId: string,
  request: RespondToDealRequest
): Promise<DealResponse> {
  const res = await fetch(`${BASE_URL}/deals/${dealId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });
  return handleResponse<DealResponse>(res);
}

/** PATCH /api/deals/{dealId}/done — Marks an Accepted deal as Completed */
export async function markDone(dealId: string): Promise<DealResponse> {
  const res = await fetch(`${BASE_URL}/deals/${dealId}/done`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  return handleResponse<DealResponse>(res);
}

/** GET /api/conversations/{conversationId}/deals/active — Returns the current active deal for a conversation */
export async function getActiveDeal(conversationId: string): Promise<DealResponse | null> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/deals/active`, {
    method: "GET",
    credentials: "include",
  });
  if (res.status === 204) {
    return null;
  }
  return handleResponse<DealResponse>(res);
}

/** GET /api/products/{productId}/deals — Returns all deals for a product */
export async function getProductDeals(
  productId: string,
  status?: DealStatus[]
): Promise<ProductDealsResponse> {
  const params = new URLSearchParams();
  if (status && status.length > 0) {
    params.set("status", status.join(","));
  }
  const url = `${BASE_URL}/products/${productId}/deals${params.toString() ? "?" + params.toString() : ""}`;
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<ProductDealsResponse>(res);
}
