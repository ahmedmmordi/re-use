const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ─── Enums (mirror backend) ─────────────────────────────────────────────────

export type MessageType =
  | "Text"
  | "Media"
  | "Offer"
  | "OfferAccepted"
  | "OfferDeclined"
  | "SystemEvent";

export type ConversationType = "BuyerSeller" | "WantedOffer" | "SwapRequest";

export type ConversationStatus = "Active" | "Closed" | "Archived" | "InactivityClosed";

export type ProductStatus = "Active" | "Sold" | "Closed" | "Deleted" | "UnderReview";

// ─── Response shapes ─────────────────────────────────────────────────────────

export interface ConversationResponse {
  id: string;
  productId: string;
  productTitle: string;
  productCoverImageUrl: string | null;
  productStatus: ProductStatus;
  buyerId: string;
  buyerName: string;
  buyerAvatarUrl: string | null;
  sellerId: string;
  sellerName: string;
  sellerAvatarUrl: string | null;
  conversationType: ConversationType;
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
  offerPrice: number | null;
  sentAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  isDeletedBySender: boolean;
  isDeletedByReceiver: boolean;
}

export interface PagedResult<T> {
  data: T[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ConversationDetailResponse {
  conversation: ConversationResponse;
  messages: PagedResult<MessageResponse>;
}

// ─── Request shapes ───────────────────────────────────────────────────────────

export interface StartConversationRequest {
  initialMessage?: string | null;
}

export interface SendMessageRequest {
  messageType: MessageType;
  content?: string | null;
  mediaUrl?: string | null;
  offerPrice?: number | null;
}

export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** POST /products/{productId}/conversations */
export async function startConversation(
  productId: string,
  body: StartConversationRequest
): Promise<ConversationResponse> {
  const res = await fetch(`${BASE_URL}/products/${productId}/conversations`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Failed to start conversation (${res.status})`);
  }
  return res.json();
}

/** GET /me/conversations */
export async function getMyConversations(
  params: PaginationParams = {}
): Promise<PagedResult<ConversationResponse>> {
  const query = new URLSearchParams();
  if (params.pageNumber) query.set("pageNumber", String(params.pageNumber));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  const res = await fetch(`${BASE_URL}/me/conversations?${query}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to load conversations (${res.status})`);
  return res.json();
}

/** GET /conversations/{conversationId} */
export async function getConversation(conversationId: string): Promise<ConversationDetailResponse> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to load conversation (${res.status})`);
  return res.json();
}

/** GET /conversations/{conversationId}/messages */
export async function getMessages(
  conversationId: string,
  params: PaginationParams = {}
): Promise<PagedResult<MessageResponse>> {
  const query = new URLSearchParams();
  if (params.pageNumber) query.set("pageNumber", String(params.pageNumber));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages?${query}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to load messages (${res.status})`);
  return res.json();
}

/** POST /conversations/{conversationId}/messages */
export async function sendMessage(
  conversationId: string,
  body: SendMessageRequest
): Promise<MessageResponse> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Failed to send message (${res.status})`);
  }
  return res.json();
}

/** POST /conversations/{conversationId}/offers/accept */
export async function acceptOffer(conversationId: string): Promise<MessageResponse> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/offers/accept`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to accept offer (${res.status})`);
  return res.json();
}

/** POST /conversations/{conversationId}/offers/decline */
export async function declineOffer(conversationId: string): Promise<MessageResponse> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/offers/decline`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to decline offer (${res.status})`);
  return res.json();
}

/** PATCH /conversations/{conversationId}/read */
export async function markAsRead(conversationId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/read`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to mark as read (${res.status})`);
}

/** DELETE /conversations/messages/{messageId} */
export async function deleteMessage(messageId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/conversations/messages/${messageId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to delete message (${res.status})`);
}

/** PATCH /conversations/{conversationId}/close */
export async function closeConversation(conversationId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/close`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to close conversation (${res.status})`);
}
