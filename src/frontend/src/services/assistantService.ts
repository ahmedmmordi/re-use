import type { ProductResponse } from "./productService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type AssistantRole = "user" | "assistant";

export interface AssistantTurn {
  role: AssistantRole;
  content: string;
}

export interface AssistantChatRequest {
  message: string;
  history?: AssistantTurn[];
}

export interface AssistantChatResponse {
  reply: string;
  products: ProductResponse[];
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || "Request failed");
  }
  return res.json() as Promise<T>;
}

/** POST /api/assistant — natural-language product search reply with matching products. */
export async function chatWithAssistant(
  request: AssistantChatRequest
): Promise<AssistantChatResponse> {
  const res = await fetch(`${BASE_URL}/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });
  return handleResponse<AssistantChatResponse>(res);
}
