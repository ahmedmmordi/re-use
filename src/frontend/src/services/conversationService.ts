import type { PagedResult } from "./categoryService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type MessageType = "Text" | "Media";
export type ConversationStatus = "Active" | "Closed";
export type ProductStatus = "Active" | "Sold" | "Closed" | "Deleted" | "UnderReview";

export interface ConversationResponse {
  id: string;
  productId: string;
  productTitle: string;
  productCoverImageUrl: string | null;
  productStatus: ProductStatus;
  reactantId: string;
  reactantName: string;
  reactantAvatarUrl: string | null;
  ownerId: string;
  ownerName: string;
  ownerAvatarUrl: string | null;
  status: ConversationStatus;
  isActive: boolean;
  lastActivityAt: string;
  createdAt: string;
  lastMessagePreview: string | null;
  unreadCount: number;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  messageType: MessageType;
  content: string | null;
  mediaUrl: string | null;
  sentAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  isDeletedBySender: boolean;
  isDeletedByReceiver: boolean;
}

export interface ConversationDetailResponse {
  conversation: ConversationResponse;
  messages: PagedResult<MessageResponse>;
}

export interface StartConversationRequest {
  initialMessage?: string | null;
}

export interface SendMessageRequest {
  messageType: MessageType;
  content?: string | null;
  mediaUrl?: string | null;
  imageFile?: File | null;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorData.message || "Request failed");
  }
  return res.json() as Promise<T>;
}

async function handleEmptyResponse(res: Response): Promise<void> {
  if (res.ok) return;
  const errorData = await res.json().catch(() => ({ message: "Request failed" }));
  throw new Error(errorData.message || "Request failed");
}

/** POST /api/products/{productId}/conversations — Start a conversation on a listing */
export async function startConversation(
  productId: string,
  request: StartConversationRequest
): Promise<ConversationResponse> {
  const res = await fetch(`${BASE_URL}/products/${productId}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(request),
  });
  return handleResponse<ConversationResponse>(res);
}

/** GET /api/me/conversations — Get conversations of the logged-in user */
export async function getMyConversations(
  pageNumber = 1,
  pageSize = 50
): Promise<PagedResult<ConversationResponse>> {
  const params = new URLSearchParams();
  params.set("Pagination.PageNumber", String(pageNumber));
  params.set("Pagination.PageSize", String(pageSize));

  const res = await fetch(`${BASE_URL}/me/conversations?${params.toString()}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<PagedResult<ConversationResponse>>(res);
}

/** GET /api/conversations/{conversationId} — Get conversation details + first page of messages */
export async function getConversation(conversationId: string): Promise<ConversationDetailResponse> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}`, {
    method: "GET",
    credentials: "include",
  });
  return handleResponse<ConversationDetailResponse>(res);
}

/** GET /api/conversations/{conversationId}/messages — Get conversation messages paginated */
export async function getMessages(
  conversationId: string,
  pageNumber = 1,
  pageSize = 30
): Promise<PagedResult<MessageResponse>> {
  const params = new URLSearchParams();
  params.set("Pagination.PageNumber", String(pageNumber));
  params.set("Pagination.PageSize", String(pageSize));

  const res = await fetch(
    `${BASE_URL}/conversations/${conversationId}/messages?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  return handleResponse<PagedResult<MessageResponse>>(res);
}

/** POST /api/conversations/{conversationId}/messages — Send a message in a conversation */
export async function sendMessage(
  conversationId: string,
  request: SendMessageRequest
): Promise<MessageResponse> {
  const formData = new FormData();
  formData.append("messageType", request.messageType);
  if (request.content !== undefined && request.content !== null) {
    formData.append("content", request.content);
  }
  if (request.mediaUrl !== undefined && request.mediaUrl !== null) {
    formData.append("mediaUrl", request.mediaUrl);
  }
  if (request.imageFile) {
    formData.append("imageFile", request.imageFile);
  }

  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleResponse<MessageResponse>(res);
}

/** PATCH /api/conversations/{conversationId}/read — Mark a conversation as read */
export async function markAsRead(conversationId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/read`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  await handleEmptyResponse(res);
}

/** DELETE /api/conversations/messages/{messageId} — Soft-delete a message */
export async function deleteMessage(messageId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/conversations/messages/${messageId}`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleEmptyResponse(res);
}

/** PATCH /api/conversations/{conversationId}/close — Close a conversation */
export async function closeConversation(conversationId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/close`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  await handleEmptyResponse(res);
}
