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

  const activeChat = conversations.find((c) => c.id === activeConversationId);
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
