import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  Tag,
  CheckCircle2,
  XCircle,
  Package,
  Loader2,
  AlertCircle,
  Clock,
  DollarSign,
  ArrowRight,
  MessageCircle,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getConversation,
  sendMessage,
  acceptOffer,
  declineOffer,
  type ConversationDetailResponse,
  type MessageResponse,
} from "../services/conversationService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(ts: string): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
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
    size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-14 h-14 text-base" : "w-10 h-10 text-sm";
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

// ─── Deal Status Banner ───────────────────────────────────────────────────────

function DealStatusBanner({
  status,
}: {
  status: "pending" | "accepted" | "declined" | "no_offer";
}) {
  if (status === "no_offer") return null;

  const map = {
    pending: {
      icon: <Clock className="w-5 h-5 text-yellow-600" />,
      title: "Offer pending",
      desc: "Waiting for the other party to respond.",
      cls: "bg-yellow-50 border-yellow-200 text-yellow-800",
    },
    accepted: {
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      title: "Offer accepted",
      desc: "Both parties have agreed. Proceed to complete the deal.",
      cls: "bg-green-50 border-green-200 text-green-800",
    },
    declined: {
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      title: "Offer declined",
      desc: "The offer was declined. You can send a new offer or continue negotiating.",
      cls: "bg-red-50 border-red-200 text-red-700",
    },
  };

  const { icon, title, desc, cls } = map[status];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${cls}`}>
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs mt-0.5 opacity-80">{desc}</p>
      </div>
    </div>
  );
}

// ─── Offer Card ───────────────────────────────────────────────────────────────

function OfferCard({
  msg,
  isMine,
  currentStatus,
  canRespond,
  onAccept,
  onDecline,
  onViewSender,
  accepting,
  declining,
}: {
  msg: MessageResponse;
  isMine: boolean;
  currentStatus: "pending" | "accepted" | "declined" | "no_offer";
  canRespond: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onViewSender: () => void;
  accepting: boolean;
  declining: boolean;
}) {
  const isPending = currentStatus === "pending";
  const isAccepted = currentStatus === "accepted";
  const isDeclined = currentStatus === "declined";

  return (
    <div
      className={`rounded-2xl border-2 p-4 ${
        isAccepted
          ? "border-green-400 bg-green-50"
          : isDeclined
            ? "border-red-300 bg-red-50"
            : "border-[#3d2e7c]/30 bg-white"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#4a3689]" />
          <span className="text-xs font-semibold text-[#4a3689] uppercase tracking-wide">
            Price Offer
          </span>
        </div>
        <span className="text-xs text-gray-400">{formatTime(msg.sentAt)}</span>
      </div>

      {/* Price */}
      <p className="text-3xl font-bold text-gray-900 mb-1">${msg.offerPrice?.toLocaleString()}</p>
      {msg.content && (
        <p className="text-sm text-gray-600 mt-1 mb-3 border-l-2 border-gray-200 pl-3 italic">
          "{msg.content}"
        </p>
      )}

      {/* Sent by */}
      <p className="text-xs text-gray-400 mb-4">
        Offered by{" "}
        <button onClick={onViewSender} className="font-medium text-[#4a3689] hover:underline">
          {msg.senderName}
        </button>
      </p>

      {/* Status */}
      {isAccepted && (
        <div className="flex items-center gap-2 text-green-700 bg-green-100 rounded-xl px-3 py-2 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          Accepted
        </div>
      )}
      {isDeclined && (
        <div className="flex items-center gap-2 text-red-600 bg-red-100 rounded-xl px-3 py-2 text-sm font-semibold">
          <XCircle className="w-4 h-4" />
          Declined
        </div>
      )}

      {/* Action buttons — only for the receiver when offer is still pending */}
      {isPending && canRespond && !isMine && (
        <div className="flex gap-3">
          <button
            onClick={onDecline}
            disabled={declining || accepting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-red-300 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-all"
          >
            {declining ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            Decline
          </button>
          <button
            onClick={onAccept}
            disabled={accepting || declining}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-br from-[#3d2e7c] to-[#4a3689] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {accepting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Accept
          </button>
        </div>
      )}

      {isPending && isMine && (
        <p className="text-xs text-yellow-700 bg-yellow-50 rounded-xl px-3 py-2">
          Waiting for a response…
        </p>
      )}
    </div>
  );
}

// ─── Send Offer Form ──────────────────────────────────────────────────────────

function SendOfferForm({
  onSend,
  sending,
  error,
  disabled,
}: {
  onSend: (price: number, note: string) => void;
  sending: boolean;
  error: string | null;
  disabled: boolean;
}) {
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [priceError, setPriceError] = useState<string | null>(null);

  const handleSubmit = () => {
    const p = parseFloat(price);
    if (!price || isNaN(p) || p <= 0) {
      setPriceError("Enter a valid price greater than 0.");
      return;
    }
    setPriceError(null);
    onSend(p, note.trim());
    setPrice("");
    setNote("");
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-[#4a3689]" />
        <h3 className="font-semibold text-gray-900">Send an Offer</h3>
      </div>

      {disabled && (
        <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3 mb-4">
          Offers can only be sent in active conversations. This conversation is closed.
        </p>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Your offer price *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
              $
            </span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setPriceError(null);
              }}
              disabled={disabled || sending}
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4a3689] focus:ring-1 focus:ring-[#4a3689]/20 disabled:bg-gray-50 disabled:text-gray-400 transition-all"
            />
          </div>
          {priceError && <p className="text-xs text-red-500 mt-1">{priceError}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={disabled || sending}
            placeholder="Add a note about your offer…"
            rows={2}
            maxLength={4000}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:border-[#4a3689] focus:ring-1 focus:ring-[#4a3689]/20 disabled:bg-gray-50 disabled:text-gray-400 transition-all"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={disabled || sending || !price}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-br from-[#3d2e7c] to-[#4a3689] text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Tag className="w-4 h-4" />
              Send Offer
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Timeline ────────────────────────────────────────────────────────────────

function Timeline({ messages }: { messages: MessageResponse[] }) {
  const offerMessages = messages.filter((m) =>
    ["Offer", "OfferAccepted", "OfferDeclined", "SystemEvent"].includes(m.messageType)
  );

  if (offerMessages.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No deal activity yet.</p>
        <p className="text-xs mt-1">Use the form above to send your first offer.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {offerMessages.map((msg) => {
        const iconMap: Record<string, React.ReactElement> = {
          Offer: <Tag className="w-3.5 h-3.5 text-[#4a3689]" />,
          OfferAccepted: <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />,
          OfferDeclined: <XCircle className="w-3.5 h-3.5 text-red-500" />,
          SystemEvent: <ArrowRight className="w-3.5 h-3.5 text-gray-400" />,
        };
        const bgMap: Record<string, string> = {
          Offer: "bg-[#3d2e7c]/8 border-[#3d2e7c]/20",
          OfferAccepted: "bg-green-50 border-green-200",
          OfferDeclined: "bg-red-50 border-red-200",
          SystemEvent: "bg-gray-50 border-gray-200",
        };

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-3 p-3 rounded-xl border ${bgMap[msg.messageType] ?? "bg-gray-50 border-gray-200"}`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {iconMap[msg.messageType] ?? <ArrowRight className="w-3.5 h-3.5 text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-gray-700">
                  {msg.messageType === "Offer"
                    ? `Offer: $${msg.offerPrice?.toLocaleString()}`
                    : msg.messageType === "OfferAccepted"
                      ? "Offer Accepted"
                      : msg.messageType === "OfferDeclined"
                        ? "Offer Declined"
                        : (msg.content ?? msg.messageType)}
                </p>
                <span className="text-[10px] text-gray-400 flex-shrink-0">
                  {formatTime(msg.sentAt)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{msg.senderName}</p>
              {msg.content && msg.messageType === "Offer" && (
                <p className="text-xs text-gray-500 mt-1 italic">"{msg.content}"</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main DealFlowPage ────────────────────────────────────────────────────────

export function DealFlowPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const conversationId = searchParams.get("conversationId");

  const [detail, setDetail] = useState<ConversationDetailResponse | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sendingOffer, setSendingOffer] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const currentUserId = user?.id ?? "";

  const load = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getConversation(conversationId);
      setDetail(res);
      setMessages(res.messages.data.slice().reverse());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deal");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Derive deal state from messages ──────────────────────────────────────

  const latestOffer = messages
    .slice()
    .reverse()
    .find((m) => m.messageType === "Offer");

  const latestOfferIdx = latestOffer ? messages.lastIndexOf(latestOffer) : -1;

  // Check if there's a response (accept/decline) after the latest offer
  const messagesAfterOffer = latestOfferIdx >= 0 ? messages.slice(latestOfferIdx + 1) : [];

  const hasAccepted = messagesAfterOffer.some((m) => m.messageType === "OfferAccepted");
  const hasDeclined = messagesAfterOffer.some((m) => m.messageType === "OfferDeclined");

  const dealStatus: "pending" | "accepted" | "declined" | "no_offer" = !latestOffer
    ? "no_offer"
    : hasAccepted
      ? "accepted"
      : hasDeclined
        ? "declined"
        : "pending";

  const conv = detail?.conversation ?? null;
  const isBuyer = conv ? conv.buyerId === currentUserId : false;
  const isSeller = conv ? conv.sellerId === currentUserId : false;
  const isActive = conv?.isActive ?? false;

  const otherName = conv ? (isBuyer ? conv.sellerName : conv.buyerName) : "";
  const otherAvatar = conv ? (isBuyer ? conv.sellerAvatarUrl : conv.buyerAvatarUrl) : null;

  // ── Send offer ────────────────────────────────────────────────────────────
  const handleSendOffer = async (price: number, note: string) => {
    if (!conversationId) return;
    setSendingOffer(true);
    setOfferError(null);
    try {
      const msg = await sendMessage(conversationId, {
        messageType: "Offer",
        offerPrice: price,
        content: note || null,
      });
      setMessages((prev) => [...prev, msg]);
    } catch (err) {
      setOfferError(err instanceof Error ? err.message : "Failed to send offer");
    } finally {
      setSendingOffer(false);
    }
  };

  // ── Accept offer ──────────────────────────────────────────────────────────
  const handleAccept = async () => {
    if (!conversationId) return;
    setAccepting(true);
    setActionError(null);
    try {
      const msg = await acceptOffer(conversationId);
      setMessages((prev) => [...prev, msg]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to accept offer");
    } finally {
      setAccepting(false);
    }
  };

  // ── Decline offer ─────────────────────────────────────────────────────────
  const handleDecline = async () => {
    if (!conversationId) return;
    setDeclining(true);
    setActionError(null);
    try {
      const msg = await declineOffer(conversationId);
      setMessages((prev) => [...prev, msg]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to decline offer");
    } finally {
      setDeclining(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  if (!conversationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] to-[#F3F4F6] flex items-center justify-center p-6">
        <div className="text-center">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-600 mb-1">No conversation selected</p>
          <p className="text-sm text-gray-400 mb-4">Open a conversation first to manage offers.</p>
          <button
            onClick={() => navigate("/chat")}
            className="text-sm text-[#4a3689] hover:underline flex items-center gap-1 mx-auto"
          >
            <MessageCircle className="w-4 h-4" />
            Go to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] to-[#F3F4F6]">
      {/* Page header */}
      <div className="bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] py-6 sm:py-8">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 md:px-8">
          <button
            onClick={() => navigate(`/chat?id=${conversationId}`)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to conversation
          </button>
          <div className="flex items-center gap-3">
            <Tag className="w-7 h-7 sm:w-8 sm:h-8 text-white/80" />
            <h1 className="text-white text-2xl sm:text-3xl font-semibold">Deal Flow</h1>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 md:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-[#4a3689]" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={load} className="text-sm text-[#4a3689] hover:underline">
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* ── Left column: Offer actions ─────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">
              {/* Conversation summary card */}
              {conv && (
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    {/* Product thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {conv.productCoverImageUrl ? (
                        <img
                          src={conv.productCoverImageUrl}
                          alt={conv.productTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold text-gray-900 text-sm truncate cursor-pointer hover:text-[#4a3689] transition-colors"
                        onClick={() => navigate(`/product/${conv.productId}`)}
                      >
                        {conv.productTitle}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Avatar url={otherAvatar} name={otherName} size="sm" />
                        <span className="text-xs text-gray-500">{otherName}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span
                          className={`text-xs font-medium ${
                            conv.status === "Active" ? "text-green-600" : "text-gray-500"
                          }`}
                        >
                          {conv.status === "Active" ? "● Active" : conv.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Deal status banner */}
              <DealStatusBanner status={dealStatus} />

              {actionError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {actionError}
                </div>
              )}

              {/* Current offer card */}
              {latestOffer && (
                <OfferCard
                  msg={latestOffer}
                  isMine={latestOffer.senderId === currentUserId}
                  currentStatus={dealStatus}
                  canRespond={isActive}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onViewSender={() => navigate(`/profile/${latestOffer.senderId}`)}
                  accepting={accepting}
                  declining={declining}
                />
              )}

              {/* Send new offer form — only the seller in a WantedOffer conversation can send offers */}
              {conv?.conversationType === "WantedOffer" && isSeller && (
                <SendOfferForm
                  onSend={handleSendOffer}
                  sending={sendingOffer}
                  error={offerError}
                  disabled={!isActive}
                />
              )}

              {/* After acceptance: completion checklist */}
              {dealStatus === "accepted" && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Next steps
                  </h3>
                  <ul className="space-y-2 text-sm text-green-700">
                    {[
                      "Agree on a meeting place via chat",
                      "Inspect the item before completing payment",
                      "Complete the payment as agreed",
                      "Mark the product as sold in your profile",
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
                        {step}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate(`/chat?id=${conversationId}`)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Continue in chat
                  </button>
                </div>
              )}
            </div>

            {/* ── Right column: Timeline ─────────────────────────────────── */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Deal activity
                </h3>
                <Timeline messages={messages} />
              </div>

              {/* Quick stats */}
              {messages.filter((m) => m.messageType === "Offer").length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-900 text-sm mb-3">Negotiation summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Offers sent</span>
                      <span className="font-semibold text-gray-800">
                        {messages.filter((m) => m.messageType === "Offer").length}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Latest offer</span>
                      <span className="font-semibold text-gray-800">
                        {latestOffer ? `$${latestOffer.offerPrice?.toLocaleString()}` : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Status</span>
                      <span
                        className={`font-semibold capitalize ${
                          dealStatus === "accepted"
                            ? "text-green-600"
                            : dealStatus === "declined"
                              ? "text-red-500"
                              : dealStatus === "pending"
                                ? "text-yellow-600"
                                : "text-gray-400"
                        }`}
                      >
                        {dealStatus === "no_offer" ? "No offer yet" : dealStatus}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick nav */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Quick links</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate(`/chat?id=${conversationId}`)}
                    className="w-full flex items-center gap-2 text-xs text-gray-600 hover:text-[#4a3689] hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors text-left"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Open conversation
                  </button>
                  {conv && (
                    <button
                      onClick={() => navigate(`/product/${conv.productId}`)}
                      className="w-full flex items-center gap-2 text-xs text-gray-600 hover:text-[#4a3689] hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors text-left"
                    >
                      <Package className="w-3.5 h-3.5" />
                      View product listing
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
