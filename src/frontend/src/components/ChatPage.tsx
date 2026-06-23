import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  Search,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  Check,
  CheckCheck,
  Lock,
  ChevronLeft,
  ExternalLink,
  MessageSquare,
  Clock,
  Circle,
  X,
  Handshake,
  DollarSign,
} from "lucide-react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import type { ConversationResponse } from "../services/conversationService";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "./ui/alert-dialog";
import {
  getActiveDeal,
  createDeal,
  respondToDeal,
  markDone,
  getProductDeals,
} from "../services/dealService";
import type { DealResponse } from "../services/dealService";
import { getProductDetails } from "../services/productService";
import type { ProductDetailsResponse } from "../services/productService";
import { createFeedback, getProductFeedback } from "../services/feedbackService";

function getOtherParticipant(conv: ConversationResponse, currentUserFullName?: string) {
  if (currentUserFullName && conv.ownerName.toLowerCase() === currentUserFullName.toLowerCase()) {
    return {
      id: conv.reactantId,
      name: conv.reactantName,
      avatarUrl: conv.reactantAvatarUrl,
    };
  }
  return {
    id: conv.ownerId,
    name: conv.ownerName,
    avatarUrl: conv.ownerAvatarUrl,
  };
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatPage({ urlConversationId }: { urlConversationId?: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    conversations,
    activeConversationId,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    connectionStatus,
    selectConversation,
    sendMessage,
    deleteMessage,
    closeConversation,
  } = useChat();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Closed">("All");
  const [inputText, setInputText] = useState("");
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // Alert state for custom confirm alerts
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync URL conversationId with context
  useEffect(() => {
    if (urlConversationId) {
      selectConversation(urlConversationId);
      setMobileView("chat");
    } else {
      selectConversation(null);
      setMobileView("list");
    }
  }, [urlConversationId, selectConversation]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Deal service states
  const [activeDeal, setActiveDeal] = useState<DealResponse | null>(null);
  const [isLoadingDeal, setIsLoadingDeal] = useState(false);
  const [productDetails, setProductDetails] = useState<ProductDetailsResponse | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [proposePrice, setProposePrice] = useState("");
  const [proposeNotes, setProposeNotes] = useState("");
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [dealError, setDealError] = useState("");

  // Feedback states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackStars, setFeedbackStars] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [completedDeal, setCompletedDeal] = useState<DealResponse | null>(null);
  const [hasLeftFeedback, setHasLeftFeedback] = useState(false);
  const [rateeUser, setRateeUser] = useState<{ id: string; name: string } | null>(null);

  // Fetch active deal when active conversation changes
  useEffect(() => {
    let active = true;
    if (activeConversationId) {
      setIsLoadingDeal(true);
      getActiveDeal(activeConversationId)
        .then((deal) => {
          if (active) setActiveDeal(deal);
        })
        .catch((err) => {
          console.error("Failed to fetch active deal", err);
        })
        .finally(() => {
          if (active) setIsLoadingDeal(false);
        });
    } else {
      setActiveDeal(null);
      setProductDetails(null);
    }
    return () => {
      active = false;
    };
  }, [activeConversationId]);

  const activeChat = conversations.find((c) => c.id === activeConversationId);

  // Fetch product details when active chat product changes
  useEffect(() => {
    let active = true;
    if (activeChat?.productId) {
      setIsLoadingProduct(true);
      getProductDetails(activeChat.productId)
        .then((prod: ProductDetailsResponse) => {
          if (active) setProductDetails(prod);
        })
        .catch((err: unknown) => {
          console.error("Failed to fetch product details", err);
        })
        .finally(() => {
          if (active) setIsLoadingProduct(false);
        });
    } else {
      setProductDetails(null);
    }
    return () => {
      active = false;
    };
  }, [activeChat?.productId]);

  // Fetch completed deal and check feedback status when active chat product changes
  useEffect(() => {
    let active = true;
    if (activeChat?.productId && user?.id) {
      const checkFeedbackStatus = async () => {
        try {
          const dealsRes = await getProductDeals(activeChat.productId);
          const compDeal = dealsRes.deals.find((d) => d.status === "Completed");

          if (!active) return;
          setCompletedDeal(compDeal || null);

          if (compDeal) {
            let ratee: { id: string; name: string } | null = null;
            let eligibleToRate = false;

            const userIdLower = user.id.toLowerCase();
            const proposerIdLower = compDeal.proposer.id.toLowerCase();
            const receiverIdLower = compDeal.receiver.id.toLowerCase();

            console.log(
              "[Feedback Check] Found completed deal:",
              compDeal.id,
              "Type:",
              compDeal.dealType
            );
            console.log(
              "[Feedback Check] User ID:",
              userIdLower,
              "Proposer:",
              proposerIdLower,
              "Receiver:",
              receiverIdLower
            );

            if (
              compDeal.dealType === "DirectPurchase" ||
              compDeal.dealType === "NegotiatedPurchase" ||
              compDeal.dealType === "WantedOffer"
            ) {
              if (userIdLower === receiverIdLower) {
                eligibleToRate = true;
                ratee = { id: compDeal.proposer.id, name: compDeal.proposer.name };
              }
            } else if (compDeal.dealType === "Swap") {
              if (userIdLower === proposerIdLower) {
                eligibleToRate = true;
                ratee = { id: compDeal.receiver.id, name: compDeal.receiver.name };
              } else if (userIdLower === receiverIdLower) {
                eligibleToRate = true;
                ratee = { id: compDeal.proposer.id, name: compDeal.proposer.name };
              }
            }

            console.log("[Feedback Check] eligibleToRate:", eligibleToRate, "rateeUser:", ratee);

            setRateeUser(ratee);

            if (eligibleToRate) {
              const feedbacks = await getProductFeedback(activeChat.productId);
              const alreadyRated = feedbacks.some((f) => f.rater.id.toLowerCase() === userIdLower);
              console.log(
                "[Feedback Check] Feedbacks found:",
                feedbacks.length,
                "alreadyRated:",
                alreadyRated
              );
              if (active) setHasLeftFeedback(alreadyRated);
            } else {
              setHasLeftFeedback(true);
            }
          } else {
            setRateeUser(null);
            setHasLeftFeedback(false);
          }
        } catch (err) {
          console.error("Failed to check feedback status", err);
        }
      };

      checkFeedbackStatus();
    } else {
      setCompletedDeal(null);
      setHasLeftFeedback(false);
      setRateeUser(null);
    }
    return () => {
      active = false;
    };
  }, [activeChat?.productId, activeConversationId, user?.id]);

  const otherUser = activeChat ? getOtherParticipant(activeChat, user?.fullName) : null; // Backend provides Guid, but here we can match

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const participant = getOtherParticipant(c, user?.fullName); // Or match by occupant id/name
    const matchesSearch =
      participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.lastMessagePreview &&
        c.lastMessagePreview.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" && c.isActive) ||
      (statusFilter === "Closed" && !c.isActive);

    return matchesSearch && matchesStatus;
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !mediaUrlInput.trim()) return;

    try {
      if (mediaUrlInput.trim()) {
        await sendMessage(inputText.trim() || null, mediaUrlInput.trim(), "Media");
        setMediaUrlInput("");
        setShowMediaModal(false);
      } else {
        await sendMessage(inputText.trim(), null, "Text");
      }
      setInputText("");
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const handleBackToList = () => {
    selectConversation(null);
    navigate("/chat");
    setMobileView("list");
  };

  const handleSelectChat = (id: string) => {
    navigate(`/chat/${id}`);
    setMobileView("chat");
  };

  const handleCloseThread = () => {
    if (!activeConversationId) return;
    setAlertState({
      isOpen: true,
      title: "Close Conversation?",
      description:
        "Are you sure you want to close this conversation? You won't be able to send any more messages.",
      onConfirm: async () => {
        try {
          await closeConversation(activeConversationId);
          setAlertState(null);
        } catch (err) {
          console.error("Failed to close conversation", err);
        }
      },
    });
  };

  const handleDeleteMessage = (msgId: string) => {
    setAlertState({
      isOpen: true,
      title: "Delete Message?",
      description:
        "Are you sure you want to delete this message? This action will remove it from your chat view.",
      onConfirm: async () => {
        try {
          await deleteMessage(msgId);
          setAlertState(null);
        } catch (err) {
          console.error("Failed to delete message", err);
        }
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMediaError("");
    }
  };

  const handleUploadAndSend = async () => {
    if (!selectedFile) {
      setMediaError("Please select an image file first.");
      return;
    }
    setIsUploading(true);
    setMediaError("");
    try {
      await sendMessage(inputText.trim() || null, null, "Media", selectedFile);
      setInputText("");
      setSelectedFile(null);
      setShowMediaModal(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload image.";
      setMediaError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRespondToDeal = async (dealId: string, action: "Accept" | "Reject") => {
    setAlertState({
      isOpen: true,
      title: `${action} Deal Proposal?`,
      description: `Are you sure you want to ${action.toLowerCase()} this deal proposal?`,
      onConfirm: async () => {
        try {
          await respondToDeal(dealId, { action });
          const deal = await getActiveDeal(activeConversationId!);
          setActiveDeal(deal);
          selectConversation(activeConversationId);
          setAlertState(null);
        } catch (err) {
          console.error("Failed to respond to deal", err);
          alert(err instanceof Error ? err.message : "Failed to respond to deal");
        }
      },
    });
  };

  const handleMarkDone = async (dealId: string) => {
    setAlertState({
      isOpen: true,
      title: "Complete Deal?",
      description:
        "Are you sure you want to mark this deal as completed? This will close the listing.",
      onConfirm: async () => {
        try {
          const compDeal = await markDone(dealId);
          const deal = await getActiveDeal(activeConversationId!);
          setActiveDeal(deal);
          await selectConversation(activeConversationId);
          setAlertState(null);

          // Trigger feedback flow immediately if eligible
          if (activeChat?.productId && user?.id) {
            setCompletedDeal(compDeal || null);

            if (compDeal) {
              let ratee: { id: string; name: string } | null = null;
              let eligibleToRate = false;

              const userIdLower = user.id.toLowerCase();
              const proposerIdLower = compDeal.proposer.id.toLowerCase();
              const receiverIdLower = compDeal.receiver.id.toLowerCase();

              console.log(
                "[Feedback MarkDone] Found completed deal:",
                compDeal.id,
                "Type:",
                compDeal.dealType
              );
              console.log(
                "[Feedback MarkDone] User ID:",
                userIdLower,
                "Proposer:",
                proposerIdLower,
                "Receiver:",
                receiverIdLower
              );

              if (
                compDeal.dealType === "DirectPurchase" ||
                compDeal.dealType === "NegotiatedPurchase" ||
                compDeal.dealType === "WantedOffer"
              ) {
                if (userIdLower === receiverIdLower) {
                  eligibleToRate = true;
                  ratee = { id: compDeal.proposer.id, name: compDeal.proposer.name };
                }
              } else if (compDeal.dealType === "Swap") {
                if (userIdLower === proposerIdLower) {
                  eligibleToRate = true;
                  ratee = { id: compDeal.receiver.id, name: compDeal.receiver.name };
                } else if (userIdLower === receiverIdLower) {
                  eligibleToRate = true;
                  ratee = { id: compDeal.proposer.id, name: compDeal.proposer.name };
                }
              }

              console.log(
                "[Feedback MarkDone] eligibleToRate:",
                eligibleToRate,
                "rateeUser:",
                ratee
              );

              setRateeUser(ratee);

              if (eligibleToRate) {
                setHasLeftFeedback(false);
                setShowFeedbackModal(true);
              }
            }
          }
        } catch (err) {
          console.error("Failed to complete deal", err);
          alert(err instanceof Error ? err.message : "Failed to complete deal");
        }
      },
    });
  };

  const handleProposeDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationId) return;

    setIsSubmittingProposal(true);
    setDealError("");

    try {
      const price = proposePrice.trim() ? parseFloat(proposePrice) : null;
      if (price !== null && isNaN(price)) {
        throw new Error("Invalid price value.");
      }

      await createDeal(activeConversationId, {
        agreedPrice: price,
        notes: proposeNotes.trim() || null,
      });

      setProposePrice("");
      setProposeNotes("");
      setShowProposeModal(false);

      const deal = await getActiveDeal(activeConversationId);
      setActiveDeal(deal);
      selectConversation(activeConversationId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to propose deal.";
      setDealError(message);
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const handleLeaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !rateeUser) return;

    setIsSubmittingFeedback(true);
    setFeedbackError("");

    try {
      await createFeedback(activeChat.productId, {
        rateeUserId: rateeUser.id,
        stars: feedbackStars,
        comment: feedbackComment.trim(),
      });

      setFeedbackStars(5);
      setFeedbackComment("");
      setShowFeedbackModal(false);
      setHasLeftFeedback(true);

      setAlertState({
        isOpen: true,
        title: "Feedback Submitted!",
        description:
          "Thank you for sharing your experience. Your feedback has been posted successfully.",
        onConfirm: () => {
          setAlertState(null);
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit feedback.";
      setFeedbackError(message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const renderDealPanel = () => {
    if (!activeChat) return null;

    const isOwner = user?.id === activeChat.ownerId;
    const isProposer = activeDeal && user?.id === activeDeal.proposer.id;
    const isReceiver = activeDeal && user?.id === activeDeal.receiver.id;

    if (activeDeal) {
      // ─── Case 1: Active Deal Exists (Pending or Accepted) ──────────────────
      const isPending = activeDeal.status === "Pending";
      const isAccepted = activeDeal.status === "Accepted";

      return (
        <div
          className={`border-b px-4 py-3 flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
            isAccepted ? "bg-emerald-50/40 border-emerald-100" : "bg-[#7C3AED]/5 border-purple-100"
          }`}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isAccepted ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700"
              }`}
            >
              <Handshake className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-900">
                  {isPending ? "Deal Proposal Pending" : "Deal Accepted & Reserved"}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isAccepted ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {activeDeal.dealType === "Swap"
                    ? "Swap Deal"
                    : activeDeal.dealType === "WantedOffer"
                      ? "Wanted Offer"
                      : "Purchase Deal"}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-600 flex-wrap">
                {activeDeal.agreedPrice !== null && (
                  <span className="flex items-center gap-1 font-semibold text-gray-800">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                    {activeDeal.agreedPrice.toFixed(2)}
                  </span>
                )}
                {activeDeal.notes && (
                  <span
                    className="truncate max-w-[200px] sm:max-w-[300px] text-gray-500 italic"
                    title={activeDeal.notes}
                  >
                    "{activeDeal.notes}"
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Proposed by {isProposer ? "you" : activeDeal.proposer.name} to{" "}
                {isReceiver ? "you" : activeDeal.receiver.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
            {isPending && isReceiver && (
              <>
                <button
                  onClick={() => handleRespondToDeal(activeDeal.id, "Reject")}
                  className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleRespondToDeal(activeDeal.id, "Accept")}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 rounded-xl shadow-xs transition-all cursor-pointer border-0"
                >
                  Accept
                </button>
              </>
            )}
            {isPending && isProposer && (
              <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                Awaiting Response...
              </span>
            )}
            {isAccepted && isReceiver && (
              <button
                onClick={() => handleMarkDone(activeDeal.id)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:opacity-95 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 border-0"
              >
                <Check className="w-3.5 h-3.5" />
                Complete Deal
              </button>
            )}
            {isAccepted && isProposer && (
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                Reserved & Awaiting Completion
              </span>
            )}
          </div>
        </div>
      );
    }

    // ─── Case 2: No Active Deal ─────────────────────────────────────────────
    if (!productDetails || !activeChat.isActive) return null;

    // Resolve eligibility
    const isProposerEligible =
      (productDetails.type === "Regular" && isOwner) ||
      (productDetails.type === "Wanted" && !isOwner) ||
      productDetails.type === "Swap";

    if (!isProposerEligible) {
      return (
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-3 flex-shrink-0 text-xs text-gray-500">
          <span>Waiting for {isOwner ? "buyer" : "seller"} to propose a deal.</span>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between gap-3 flex-shrink-0 text-xs font-sans">
        <span className="text-gray-500">No active deal in this conversation.</span>
        <button
          onClick={() => setShowProposeModal(true)}
          className="px-3 py-1 bg-white hover:bg-gray-50 text-[#7C3AED] border border-purple-200 hover:border-[#7C3AED] rounded-lg font-semibold text-xs transition-all cursor-pointer"
        >
          Propose Deal
        </button>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden relative font-sans">
      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <div
        className={`w-full md:w-[380px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0 transition-all duration-300 ${
          mobileView === "chat" ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Messages
              <MessageSquare className="w-5 h-5 text-[#7C3AED]" />
            </h2>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium">
              <Circle
                className={`w-2.5 h-2.5 fill-current ${
                  connectionStatus === "connected"
                    ? "text-emerald-500 animate-pulse"
                    : connectionStatus === "connecting"
                      ? "text-amber-500"
                      : "text-rose-500"
                }`}
              />
              <span className="capitalize text-gray-600 text-[10px]">{connectionStatus}</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chat or item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-semibold text-gray-600">
            {(["All", "Active", "Closed"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`flex-1 py-1.5 rounded-md transition-all duration-200 ${
                  statusFilter === filter
                    ? "bg-white text-[#7C3AED] shadow-sm"
                    : "hover:text-gray-900"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations Scroll Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {isLoadingConversations ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-8 h-8 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-500 font-medium">Loading threads...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-sm text-gray-500">No conversations found.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const active = conv.id === activeConversationId;
              const partner = getOtherParticipant(conv, user?.fullName); // Matching logic helper
              const hasUnread = conv.unreadCount > 0;

              return (
                <button
                  type="button"
                  key={conv.id}
                  onClick={() => handleSelectChat(conv.id)}
                  className={`w-full text-left flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 relative ${
                    active ? "bg-purple-50/50 border-[`#7C3AED`]" : "border-transparent"
                  }`}
                >
                  {/* User Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden relative">
                    {partner.avatarUrl ? (
                      <img
                        src={partner.avatarUrl}
                        alt={partner.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      partner.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Body Column */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">
                        {partner.name}
                      </h4>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {formatRelativeTime(conv.lastActivityAt)}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-[#7C3AED] mb-1 truncate">
                      Item: {conv.productTitle}
                    </div>

                    <p
                      className={`text-xs truncate ${hasUnread ? "text-gray-900 font-bold" : "text-gray-500"}`}
                    >
                      {conv.lastMessagePreview || "No messages yet"}
                    </p>
                  </div>

                  {/* Right Column (Unread Count & Listing Image) */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {conv.productCoverImageUrl && (
                      <img
                        src={conv.productCoverImageUrl}
                        alt="Product Cover"
                        className="w-8 h-8 rounded-md object-cover border border-gray-100"
                      />
                    )}
                    {hasUnread && (
                      <span className="bg-[#10B981] text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Chat View Pane ─────────────────────────────────────────────────── */}
      <div
        className={`flex-1 bg-gradient-to-b from-gray-50 to-white flex flex-col transition-all duration-300 ${
          mobileView === "list" ? "hidden md:flex" : "flex"
        }`}
      >
        {activeChat && otherUser ? (
          <>
            {/* Header bar */}
            <div className="bg-white border-b border-gray-200 px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between flex-shrink-0 z-10 shadow-xs gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <button
                  onClick={handleBackToList}
                  className="md:hidden p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors flex-shrink-0"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/profile/${otherUser.id}`)}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xs sm:text-sm overflow-hidden flex-shrink-0 hover:opacity-85 transition-opacity"
                  >
                    {otherUser.avatarUrl ? (
                      <img
                        src={otherUser.avatarUrl}
                        alt={otherUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      otherUser.name.charAt(0).toUpperCase()
                    )}
                  </button>
                  {activeChat.productCoverImageUrl && (
                    <img
                      src={activeChat.productCoverImageUrl}
                      alt={activeChat.productTitle}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0 hidden sm:block"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => navigate(`/profile/${otherUser.id}`)}
                    className="font-bold text-xs sm:text-sm text-gray-900 hover:underline hover:text-[#7C3AED] transition-colors text-left truncate block w-full"
                  >
                    {otherUser.name}
                  </button>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-xs text-gray-600 min-w-0">
                    <span className="font-semibold text-[#7C3AED] hidden sm:inline">Listing:</span>
                    <button
                      onClick={() => navigate(`/product/${activeChat.productId}`)}
                      className="hover:underline flex items-center gap-0.5 font-semibold text-gray-800 min-w-0 max-w-[100px] sm:max-w-[200px] md:max-w-none"
                    >
                      <span className="truncate">{activeChat.productTitle}</span>
                      <ExternalLink className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    </button>
                    <span
                      className={`px-1 py-0.5 rounded text-[9px] sm:text-[10px] font-bold flex-shrink-0 ${
                        activeChat.productStatus === "Active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {activeChat.productStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {activeChat.isActive && (
                <button
                  onClick={handleCloseThread}
                  className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
                >
                  <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="hidden sm:inline">Close Chat</span>
                  <span className="sm:hidden">Close</span>
                </button>
              )}
            </div>

            {/* Warning Banner if closed */}
            {!activeChat.isActive && (
              <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 text-xs text-amber-800 flex items-center gap-2 flex-shrink-0 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                This conversation is closed and is read-only. No further messages can be sent.
              </div>
            )}

            {/* Deal Panel */}
            {isLoadingDeal || isLoadingProduct ? (
              <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-center gap-2 flex-shrink-0">
                <div className="w-4 h-4 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-400 font-medium">Loading deal details...</span>
              </div>
            ) : (
              renderDealPanel()
            )}

            {/* Feedback Banner */}
            {!hasLeftFeedback && completedDeal && rateeUser && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 px-4 py-3 flex items-center justify-between gap-3 flex-shrink-0 font-sans">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <Handshake className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900">Deal Completed!</p>
                    <p className="text-[11px] text-gray-600 truncate">
                      Please share your experience rating <strong>{rateeUser.name}</strong>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs hover:opacity-95 rounded-xl shadow-xs transition-all cursor-pointer border-0 flex-shrink-0"
                >
                  Leave Feedback
                </button>
              </div>
            )}

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <div className="w-8 h-8 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-gray-500 font-semibold">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                  <MessageSquare className="w-12 h-12 stroke-1" />
                  <p className="text-sm font-medium">No messages yet. Send a greeting to start!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelf = msg.senderId !== otherUser.id; // Or match by name or user context Guid
                  const isDeleted =
                    (isSelf && msg.isDeletedBySender) || (!isSelf && msg.isDeletedByReceiver);

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-end gap-1.5 group max-w-[85%] md:max-w-[70%]">
                        {/* Options trigger (delete) */}
                        {isSelf && !isDeleted && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            title="Delete message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Bubble */}
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-xs relative w-full ${
                            isDeleted
                              ? "bg-gray-100 text-gray-400 italic border border-gray-200"
                              : isSelf
                                ? "bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white rounded-br-none"
                                : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                          }`}
                        >
                          {isDeleted ? (
                            "This message was deleted"
                          ) : (
                            <>
                              {msg.messageType === "Media" && msg.mediaUrl && (
                                <div className="mb-2 w-full max-w-full sm:max-w-sm rounded-lg overflow-hidden border border-white/20 bg-black/5">
                                  <img
                                    src={msg.mediaUrl}
                                    alt="Media Attachment"
                                    className="max-h-60 w-full object-contain cursor-pointer"
                                    onClick={() => window.open(msg.mediaUrl || "", "_blank")}
                                  />
                                </div>
                              )}
                              <p className="whitespace-pre-line break-words font-medium">
                                {msg.content}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Message Footer: Time + Read Indicator */}
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500 font-medium px-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{formatMessageTime(msg.sentAt)}</span>
                        {isSelf && !isDeleted && (
                          <span className="ml-1 flex items-center">
                            {msg.readAt ? (
                              <span title={`Read at ${new Date(msg.readAt).toLocaleTimeString()}`}>
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                              </span>
                            ) : (
                              <span title="Delivered">
                                <Check className="w-3.5 h-3.5 text-gray-400" />
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            {activeChat.isActive ? (
              <form
                onSubmit={handleSend}
                className="bg-white border-t border-gray-200 p-3 sm:p-4 flex-shrink-0 flex gap-2 items-center z-10 shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setShowMediaModal(true)}
                  className="p-2 border border-gray-200 text-gray-500 hover:text-[#7C3AED] hover:border-[#7C3AED] rounded-xl transition-all cursor-pointer"
                  title="Attach Image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  placeholder="Type your message here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] transition-colors"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all cursor-pointer flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            ) : null}
          </>
        ) : (
          // Empty State
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto">
            <div className="w-20 h-20 bg-gradient-to-tr from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <MessageSquare className="w-10 h-10 text-[#7C3AED] stroke-1.5" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Inbox</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium">
              Select a conversation from the sidebar list to view messages and discuss deals. You
              can contact listing owners directly from their product page.
            </p>
          </div>
        )}
      </div>

      {/* ─── Media Attachment Modal ────────────────────────────────────────── */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base">Upload Image</h3>
              <button
                type="button"
                onClick={() => {
                  setShowMediaModal(false);
                  setSelectedFile(null);
                  setMediaError("");
                }}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors cursor-pointer"
                disabled={isUploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 font-sans">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Select Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />

                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#7C3AED] transition-colors flex flex-col items-center justify-center gap-2 ${
                    isUploading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {selectedFile ? (
                    <div className="space-y-2 w-full">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Preview"
                        className="max-h-32 mx-auto object-contain rounded-lg"
                      />
                      <p className="text-xs text-gray-500 truncate">{selectedFile.name}</p>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                      <p className="text-sm font-semibold text-[#7C3AED]">Click to choose file</p>
                      <p className="text-xs text-gray-400">Supports JPG, PNG, GIF up to 5MB</p>
                    </>
                  )}
                </div>

                {mediaError && (
                  <p className="text-rose-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {mediaError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Message (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Say something about this image..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                  disabled={isUploading}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMediaModal(false);
                    setSelectedFile(null);
                    setMediaError("");
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUploadAndSend}
                  disabled={isUploading || !selectedFile}
                  className="px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white hover:opacity-95 rounded-xl text-sm font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0"
                >
                  {isUploading ? "Uploading..." : "Upload & Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Propose Deal Modal ─────────────────────────────────────────── */}
      {showProposeModal && productDetails && activeChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 font-sans">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base">Propose a Deal</h3>
              <button
                type="button"
                onClick={() => {
                  setShowProposeModal(false);
                  setProposePrice("");
                  setProposeNotes("");
                  setDealError("");
                }}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors cursor-pointer"
                disabled={isSubmittingProposal}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProposeDeal} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Listing Details
                </label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-100 rounded-xl">
                  {activeChat.productCoverImageUrl && (
                    <img
                      src={activeChat.productCoverImageUrl}
                      alt={activeChat.productTitle}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {activeChat.productTitle}
                    </p>
                    <p className="text-[10px] text-[#7C3AED] font-semibold">
                      Type: {productDetails.type}{" "}
                      {productDetails.price !== null ? `(Listed: $${productDetails.price})` : ""}
                    </p>
                  </div>
                </div>
              </div>

              {productDetails.type !== "Swap" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Agreed Price ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={proposePrice}
                      onChange={(e) => setProposePrice(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]"
                      required={productDetails.type === "Regular"}
                      disabled={isSubmittingProposal}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Proposal Notes / Terms
                </label>
                <textarea
                  placeholder={
                    productDetails.type === "Swap"
                      ? "Describe the swap details (e.g. trading my red bicycle for your guitar)..."
                      : "Add any additional notes (e.g. pickup time, payment details)..."
                  }
                  value={proposeNotes}
                  onChange={(e) => setProposeNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] min-h-[80px] resize-none"
                  disabled={isSubmittingProposal}
                />
              </div>

              {dealError && (
                <p className="text-rose-500 text-xs font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {dealError}
                </p>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProposeModal(false);
                    setProposePrice("");
                    setProposeNotes("");
                    setDealError("");
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  disabled={isSubmittingProposal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProposal}
                  className="px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white hover:opacity-95 rounded-xl text-sm font-semibold shadow-md transition-all cursor-pointer border-0"
                >
                  {isSubmittingProposal ? "Submitting..." : "Send Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ─── Feedback Modal ────────────────────────────────────────────── */}
      {showFeedbackModal && rateeUser && activeChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 font-sans">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base">Leave Feedback</h3>
              <button
                type="button"
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackStars(5);
                  setFeedbackComment("");
                  setFeedbackError("");
                }}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors cursor-pointer"
                disabled={isSubmittingFeedback}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLeaveFeedback} className="p-5 space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  How was your transaction experience with <strong>{rateeUser.name}</strong>?
                </p>

                {/* Star Selector */}
                <div className="flex items-center justify-center gap-1.5 py-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFeedbackStars(s)}
                      className="text-amber-400 hover:scale-110 transition-transform cursor-pointer p-1"
                      disabled={isSubmittingFeedback}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={s <= feedbackStars ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-8 h-8"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
                  {feedbackStars === 5
                    ? "Excellent!"
                    : feedbackStars === 4
                      ? "Very Good"
                      : feedbackStars === 3
                        ? "Good"
                        : feedbackStars === 2
                          ? "Fair"
                          : "Poor"}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Review Comment
                </label>
                <textarea
                  placeholder="Share details of your experience (e.g. prompt communication, item condition, punctuality)..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] min-h-[100px] resize-none"
                  required
                  disabled={isSubmittingFeedback}
                />
              </div>

              {feedbackError && (
                <p className="text-rose-500 text-xs font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {feedbackError}
                </p>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setFeedbackStars(5);
                    setFeedbackComment("");
                    setFeedbackError("");
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                  disabled={isSubmittingFeedback}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback || !feedbackComment.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white hover:opacity-95 rounded-xl text-sm font-semibold shadow-md transition-all cursor-pointer border-0"
                >
                  {isSubmittingFeedback ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Custom Alert Dialog (Radix UI Primitive) ────────────────────── */}
      {alertState && (
        <AlertDialog open={alertState.isOpen} onOpenChange={(open) => !open && setAlertState(null)}>
          <AlertDialogContent className="bg-white rounded-2xl border border-gray-100 p-6 shadow-2xl font-sans">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-900 font-bold text-lg">
                {alertState.title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 text-sm mt-2 leading-relaxed">
                {alertState.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6 flex gap-2 justify-end">
              <AlertDialogCancel className="rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold px-4 py-2 text-sm transition-colors cursor-pointer border-0">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={alertState.onConfirm}
                className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white hover:opacity-95 font-semibold px-4 py-2 text-sm transition-all shadow-md cursor-pointer border-0"
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
