import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MessageCircle,
  Send,
  ChevronLeft,
  Trash2,
  X,
  AlertCircle,
  Image as ImageIcon,
  Tag,
  CheckCheck,
  Check,
  Loader2,
  Package,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChatUnread } from "../context/ChatUnreadContext";
import {
  getMyConversations,
  getConversation,
  sendMessage,
  deleteMessage,
  closeConversation,
  markAsRead,
  getMessages,
  type ConversationResponse,
  type MessageResponse,
  type ConversationDetailResponse,
} from "../services/conversationService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(ts: string): string {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

function statusBadge(status: ConversationResponse["status"]) {
  const map: Record<string, { label: string; cls: string }> = {
    Active: { label: "Active", cls: "bg-green-100 text-green-700" },
    Closed: { label: "Closed", cls: "bg-gray-100 text-gray-500" },
    Archived: { label: "Archived", cls: "bg-yellow-100 text-yellow-700" },
    InactivityClosed: { label: "Expired", cls: "bg-red-100 text-red-500" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-500" };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
  );
}

function typeBadge(type: ConversationResponse["conversationType"]) {
  const map: Record<string, { label: string; cls: string }> = {
    BuyerSeller: { label: "Buy", cls: "bg-blue-100 text-blue-700" },
    WantedOffer: { label: "Wanted", cls: "bg-purple-100 text-purple-700" },
    SwapRequest: { label: "Swap", cls: "bg-orange-100 text-orange-700" },
  };
  const { label, cls } = map[type] ?? { label: type, cls: "bg-gray-100 text-gray-500" };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  url,
  name,
  size = "md",
}: {
  url: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const cls =
    size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-10 h-10 text-sm";
  return (
    <div
      className={`${cls} rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center font-semibold text-white overflow-hidden flex-shrink-0`}
    >
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isMine,
  onDelete,
}: {
  msg: MessageResponse;
  isMine: boolean;
  onDelete?: (id: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  const isDeleted = isMine ? msg.isDeletedBySender : msg.isDeletedByReceiver;

  if (isDeleted) {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
        <span className="text-xs text-gray-400 italic px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
          Message deleted
        </span>
      </div>
    );
  }

  // System messages — centered pill
  if (
    msg.messageType === "SystemEvent" ||
    msg.messageType === "OfferAccepted" ||
    msg.messageType === "OfferDeclined"
  ) {
    const systemColors: Record<string, string> = {
      OfferAccepted: "bg-green-50 text-green-700 border-green-200",
      OfferDeclined: "bg-red-50 text-red-600 border-red-200",
      SystemEvent: "bg-gray-50 text-gray-500 border-gray-200",
    };
    const cls = systemColors[msg.messageType];
    return (
      <div className="flex justify-center my-2">
        <span className={`text-xs px-4 py-1.5 rounded-full border ${cls} font-medium`}>
          {msg.content ?? msg.messageType}
        </span>
      </div>
    );
  }

  // Offer bubble
  if (msg.messageType === "Offer") {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2 group`}>
        <div
          className={`max-w-[75%] rounded-2xl border-2 p-3 ${
            isMine
              ? "bg-[#3d2e7c]/5 border-[#3d2e7c]/30 rounded-br-sm"
              : "bg-white border-[#3d2e7c]/20 rounded-bl-sm"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-[#4a3689]" />
            <span className="text-xs font-semibold text-[#4a3689] uppercase tracking-wide">
              Offer
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900">${msg.offerPrice?.toLocaleString()}</p>
          {msg.content && <p className="text-sm text-gray-600 mt-1">{msg.content}</p>}
          <p className="text-[10px] text-gray-400 mt-2">{formatTime(msg.sentAt)}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex flex-col gap-0.5 max-w-[75%]">
        {/* Bubble */}
        <div className="relative flex items-end gap-2">
          {!isMine && <div className="w-1" />}
          <div
            className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
              isMine
                ? "bg-gradient-to-br from-[#3d2e7c] to-[#4a3689] text-white rounded-br-sm"
                : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"
            }`}
          >
            {/* Media */}
            {msg.messageType === "Media" && msg.mediaUrl && (
              <img
                src={msg.mediaUrl}
                alt="media"
                className="rounded-lg max-w-[220px] max-h-[200px] object-cover mb-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            {msg.content && <span>{msg.content}</span>}
          </div>

          {/* Delete action */}
          {isMine && showActions && onDelete && (
            <button
              onClick={() => onDelete(msg.id)}
              className="p-1 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete message"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Timestamp + read status */}
        <div
          className={`flex items-center gap-1 text-[10px] text-gray-400 ${
            isMine ? "justify-end" : "justify-start pl-1"
          }`}
        >
          <span>{formatTime(msg.sentAt)}</span>
          {isMine && (
            <>
              {msg.readAt ? (
                <CheckCheck className="w-3 h-3 text-[#4a3689]" />
              ) : msg.deliveredAt ? (
                <CheckCheck className="w-3 h-3 text-gray-400" />
              ) : (
                <Check className="w-3 h-3 text-gray-300" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Conversation List Item ───────────────────────────────────────────────────

function ConversationItem({
  conv,
  currentUserId,
  isActive,
  onClick,
}: {
  conv: ConversationResponse;
  currentUserId: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const isBuyer = conv.buyerId === currentUserId;
  const otherName = isBuyer ? conv.sellerName : conv.buyerName;
  const otherAvatar = isBuyer ? conv.sellerAvatarUrl : conv.buyerAvatarUrl;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-150 border-b border-gray-100 ${
        isActive ? "bg-[#3d2e7c]/8 border-l-3 border-l-[#4a3689]" : "hover:bg-gray-50"
      }`}
    >
      <div className="relative">
        <Avatar url={otherAvatar} name={otherName} />
        {conv.status === "Active" && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-sm font-semibold text-gray-900 truncate">{otherName}</p>
          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
            {formatRelativeTime(conv.lastActivityAt)}
          </span>
        </div>
        <p className="text-xs text-gray-500 truncate mb-1">
          {conv.lastMessagePreview ?? conv.productTitle}
        </p>
        <div className="flex items-center gap-1.5">
          {typeBadge(conv.conversationType)}
          {statusBadge(conv.status)}
          {conv.unreadCount > 0 && (
            <span className="ml-auto bg-[#4a3689] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0">
              {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Main ChatPage ────────────────────────────────────────────────────────────

export function ChatPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { refresh: refreshUnread } = useChatUnread();

  const activeId = searchParams.get("id");

  // ── Conversation list state ─────────────────────────────────────────────
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [listPage, setListPage] = useState(1);
  const [listTotalPages, setListTotalPages] = useState(1);

  // ── Active conversation state ────────────────────────────────────────────
  const [detail, setDetail] = useState<ConversationDetailResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState<string | null>(null);
  const [msgPage, setMsgPage] = useState(1);
  const [msgHasMore, setMsgHasMore] = useState(false);

  // ── Compose state ────────────────────────────────────────────────────────
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // ── Close dialog ─────────────────────────────────────────────────────────
  const [showClose, setShowClose] = useState(false);
  const [closing, setClosing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Load conversations ───────────────────────────────────────────────────
  const loadConversations = useCallback(async (page = 1) => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await getMyConversations({ pageNumber: page, pageSize: 20 });
      if (page === 1) {
        setConversations(res.data);
      } else {
        setConversations((prev) => [...prev, ...res.data]);
      }
      setListTotalPages(res.totalPages);
      setListPage(page);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations(1);
  }, [loadConversations]);

  // ── Load active conversation ─────────────────────────────────────────────
  useEffect(() => {
    if (!activeId) {
      setDetail(null);
      setMessages([]);
      return;
    }

    const load = async () => {
      setMsgLoading(true);
      setMsgError(null);
      setMessages([]);
      setMsgPage(1);
      try {
        const res = await getConversation(activeId);
        setDetail(res);
        const msgs = res.messages.data;
        setMessages(msgs);
        setMsgHasMore(res.messages.hasNextPage);

        // Mark as read and reset this conversation's unread counter
        if (res.conversation.unreadCount > 0) {
          markAsRead(activeId)
            .then(() => {
              setConversations((prev) =>
                prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c))
              );
              refreshUnread();
            })
            .catch(() => {});
        }
      } catch (err) {
        setMsgError(err instanceof Error ? err.message : "Failed to load conversation");
      } finally {
        setMsgLoading(false);
      }
    };

    load();
  }, [activeId, refreshUnread]);

  // ── Scroll to bottom on new messages ────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Load older messages (pagination) ────────────────────────────────────
  const loadOlderMessages = async () => {
    if (!activeId || !msgHasMore) return;
    const nextPage = msgPage + 1;
    try {
      const res = await getMessages(activeId, { pageNumber: nextPage, pageSize: 20 });
      const older = res.data.slice().reverse();
      setMessages((prev) => [...older, ...prev]);
      setMsgPage(nextPage);
      setMsgHasMore(res.hasNextPage);
    } catch {
      // silently ignore
    }
  };

  // ── Send text message ─────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!activeId || !text.trim() || sending) return;
    const content = text.trim();
    setText("");
    setSending(true);
    setSendError(null);
    try {
      const msg = await sendMessage(activeId, { messageType: "Text", content });
      setMessages((prev) => [...prev, msg]);
      // Update preview in list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId ? { ...c, lastMessagePreview: content, lastActivityAt: msg.sentAt } : c
        )
      );
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send");
      setText(content); // restore
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Delete message ────────────────────────────────────────────────────────
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isDeletedBySender: true } : m))
      );
    } catch {
      // silently ignore for now
    }
  };

  // ── Close conversation ───────────────────────────────────────────────────
  const handleClose = async () => {
    if (!activeId) return;
    setClosing(true);
    try {
      await closeConversation(activeId);
      setDetail((prev) =>
        prev
          ? { ...prev, conversation: { ...prev.conversation, status: "Closed", isActive: false } }
          : prev
      );
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, status: "Closed", isActive: false } : c))
      );
      setShowClose(false);
    } catch {
      // silently ignore
    } finally {
      setClosing(false);
    }
  };

  const currentUserId = user?.id ?? "";
  const activeConv = detail?.conversation ?? null;
  const isBuyer = activeConv ? activeConv.buyerId === currentUserId : false;
  const otherName = activeConv ? (isBuyer ? activeConv.sellerName : activeConv.buyerName) : "";
  const otherId = activeConv ? (isBuyer ? activeConv.sellerId : activeConv.buyerId) : "";
  const otherAvatar = activeConv
    ? isBuyer
      ? activeConv.sellerAvatarUrl
      : activeConv.buyerAvatarUrl
    : null;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] to-[#F3F4F6]">
      {/* Page header */}
      <div className="bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] py-6 sm:py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white/80" />
            <h1 className="text-white text-2xl sm:text-3xl font-semibold">Messages</h1>
          </div>
        </div>
      </div>

      {/* Two-pane layout */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-6">
        <div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}
        >
          <div className="flex h-full">
            {/* ── Left: Conversation List ─────────────────────────────────── */}
            <div
              className={`${
                activeId ? "hidden md:flex" : "flex"
              } w-full md:w-[340px] lg:w-[380px] flex-col border-r border-gray-100 flex-shrink-0`}
            >
              {/* List header */}
              <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="font-semibold text-gray-900 text-[15px]">Conversations</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {conversations.length} thread{conversations.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* List body */}
              <div className="flex-1 overflow-y-auto">
                {listLoading && (
                  <div className="flex flex-col items-center justify-center h-40 gap-3 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-sm">Loading conversations…</span>
                  </div>
                )}

                {!listLoading && listError && (
                  <div className="p-6 text-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-500">{listError}</p>
                    <button
                      onClick={() => loadConversations(1)}
                      className="mt-3 text-sm text-[#4a3689] hover:underline"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!listLoading && !listError && conversations.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400 px-6 text-center">
                    <MessageCircle className="w-12 h-12 opacity-30" />
                    <p className="font-medium text-gray-500">No conversations yet</p>
                    <p className="text-xs text-gray-400">
                      Browse products and tap "Contact Seller" to start a conversation.
                    </p>
                  </div>
                )}

                {conversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    currentUserId={currentUserId}
                    isActive={conv.id === activeId}
                    onClick={() => {
                      setSearchParams({ id: conv.id });
                    }}
                  />
                ))}

                {/* Load more */}
                {listPage < listTotalPages && (
                  <button
                    onClick={() => loadConversations(listPage + 1)}
                    className="w-full py-3 text-sm text-[#4a3689] hover:bg-gray-50 transition-colors"
                  >
                    Load more
                  </button>
                )}
              </div>
            </div>

            {/* ── Right: Message Thread ───────────────────────────────────── */}
            <div className={`${activeId ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
              {!activeId ? (
                /* Empty state */
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6 text-gray-400">
                  <MessageCircle className="w-16 h-16 opacity-20" />
                  <p className="font-medium text-gray-500">Select a conversation</p>
                  <p className="text-sm">Choose a thread from the left to read messages.</p>
                </div>
              ) : msgLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#4a3689]" />
                </div>
              ) : msgError ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                  <p className="text-sm text-red-500">{msgError}</p>
                </div>
              ) : (
                <>
                  {/* Thread header */}
                  <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 bg-white">
                    {/* Mobile back */}
                    <button
                      onClick={() => setSearchParams({})}
                      className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button onClick={() => otherId && navigate(`/profile/${otherId}`)}>
                      <Avatar url={otherAvatar} name={otherName} />
                    </button>

                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => otherId && navigate(`/profile/${otherId}`)}
                        className="font-semibold text-gray-900 text-sm truncate hover:text-[#4a3689] hover:underline transition-colors"
                      >
                        {otherName}
                      </button>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {activeConv && typeBadge(activeConv.conversationType)}
                        {activeConv && statusBadge(activeConv.status)}
                      </div>
                    </div>

                    {/* Product chip */}
                    {activeConv && (
                      <button
                        onClick={() => navigate(`/product/${activeConv.productId}`)}
                        className="hidden sm:flex items-center gap-2.5 bg-[#3d2e7c]/5 hover:bg-[#3d2e7c]/10 border-2 border-[#3d2e7c]/20 hover:border-[#3d2e7c]/40 rounded-xl px-3 py-2 transition-all max-w-[220px] shadow-sm"
                        title={activeConv.productTitle}
                      >
                        {activeConv.productCoverImageUrl ? (
                          <img
                            src={activeConv.productCoverImageUrl}
                            alt=""
                            className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-[#4a3689] flex-shrink-0" />
                        )}
                        <div className="flex flex-col items-start min-w-0">
                          <span className="text-[10px] font-semibold text-[#4a3689] uppercase tracking-wide">
                            Listing
                          </span>
                          <span className="truncate text-xs font-medium text-gray-700 max-w-[150px]">
                            {activeConv.productTitle}
                          </span>
                        </div>
                      </button>
                    )}

                    {/* Close conversation */}
                    {activeConv?.isActive && (
                      <button
                        onClick={() => setShowClose(true)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        title="Close conversation"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50/40">
                    {/* Load older */}
                    {msgHasMore && (
                      <div className="flex justify-center mb-4">
                        <button
                          onClick={loadOlderMessages}
                          className="text-xs text-[#4a3689] hover:underline"
                        >
                          Load older messages
                        </button>
                      </div>
                    )}

                    {messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        msg={msg}
                        isMine={msg.senderId === currentUserId}
                        onDelete={handleDeleteMessage}
                      />
                    ))}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Compose area */}
                  {activeConv?.isActive ? (
                    <div className="border-t border-gray-100 bg-white p-3">
                      {sendError && <p className="text-xs text-red-500 mb-2 px-1">{sendError}</p>}
                      <div className="flex items-end gap-2">
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-[#4a3689] focus-within:ring-1 focus-within:ring-[#4a3689]/20 transition-all">
                          <textarea
                            ref={textareaRef}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Write a message… (Enter to send)"
                            rows={1}
                            className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none outline-none max-h-24"
                          />
                        </div>

                        <button
                          onClick={handleSend}
                          disabled={!text.trim() || sending}
                          className="p-2.5 bg-gradient-to-br from-[#3d2e7c] to-[#4a3689] text-white rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
                        >
                          {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Quick actions: offers (navigate to deal flow) */}
                      <div className="flex items-center gap-3 mt-2 px-1">
                        {activeConv?.conversationType === "WantedOffer" && (
                          <button
                            onClick={() => navigate(`/deals?conversationId=${activeId}`)}
                            className="flex items-center gap-1.5 text-xs text-[#4a3689] hover:underline"
                          >
                            <Package className="w-3 h-3" />
                            View Offers
                          </button>
                        )}
                        <button
                          className="flex items-center gap-1.5 text-xs text-gray-400 cursor-not-allowed"
                          disabled
                          title="Media upload – coming soon"
                        >
                          <ImageIcon className="w-3 h-3" />
                          Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-center">
                      <p className="text-sm text-gray-400">
                        This conversation is {activeConv?.status?.toLowerCase() ?? "closed"} and no
                        longer accepts new messages.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Close-conversation confirm dialog ──────────────────────────────────── */}
      {showClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowClose(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 text-[16px] mb-2">
              Close this conversation?
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Closing a conversation stops new messages. Both participants will still be able to
              read the history.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClose(false)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClose}
                disabled={closing}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {closing ? "Closing…" : "Close Conversation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
