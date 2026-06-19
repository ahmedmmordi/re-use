import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { HubConnectionBuilder, HubConnection, LogLevel } from "@microsoft/signalr";
import { useAuth } from "./AuthContext";
import {
  getMyConversations,
  getConversation,
  sendMessage as apiSendMessage,
  markAsRead as apiMarkAsRead,
  closeConversation as apiCloseConversation,
  deleteMessage as apiDeleteMessage,
  startConversation as apiStartConversation,
} from "../services/conversationService";
import type {
  ConversationResponse,
  MessageResponse,
  MessageType,
} from "../services/conversationService";

// ─── Context Types ────────────────────────────────────────────────────────────

interface ChatContextType {
  conversations: ConversationResponse[];
  activeConversationId: string | null;
  messages: MessageResponse[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";
  totalUnreadCount: number;
  fetchConversations: () => Promise<void>;
  selectConversation: (conversationId: string | null) => Promise<void>;
  sendMessage: (
    content?: string | null,
    mediaUrl?: string | null,
    type?: MessageType,
    imageFile?: File | null
  ) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  closeConversation: (conversationId: string) => Promise<void>;
  startConversation: (
    productId: string,
    initialMessage?: string | null
  ) => Promise<ConversationResponse>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const HUB_URL = import.meta.env.VITE_SIGNALR_HUB_URL || "http://localhost:5000/hubs/chat";

export function ChatProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");

  const connectionRef = useRef<HubConnection | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);

  // Sync ref with state so SignalR callbacks can read the latest value
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // Compute total unread count across all conversations
  const totalUnreadCount = conversations.reduce((acc, conv) => acc + conv.unreadCount, 0);

  // ─── REST Actions ──────────────────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingConversations(true);
    try {
      const res = await getMyConversations(1, 100);
      setConversations(res.data);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isAuthenticated]);

  // Mark a conversation as read and update states
  const markAsReadLocally = useCallback(async (conversationId: string) => {
    try {
      await apiMarkAsRead(conversationId);
      // Reset unread count locally
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }, []);

  const selectConversation = useCallback(
    async (conversationId: string | null) => {
      const previousId = activeConversationIdRef.current;

      // Leave the previous SignalR group if we had one
      if (previousId && connectionRef.current && connectionStatus === "connected") {
        try {
          await connectionRef.current.invoke("LeaveConversation", previousId);
        } catch (err) {
          console.warn("Error leaving SignalR group:", err);
        }
      }

      setActiveConversationId(conversationId);
      if (!conversationId) {
        setMessages([]);
        return;
      }

      setIsLoadingMessages(true);
      try {
        const detail = await getConversation(conversationId);
        setMessages(detail.messages.data.reverse()); // Reverse to keep chronological ordering (bottom represents latest)

        // Join new group
        if (connectionRef.current && connectionStatus === "connected") {
          try {
            await connectionRef.current.invoke("JoinConversation", conversationId);
          } catch (err) {
            console.error("Error joining SignalR group:", err);
          }
        }

        // Mark read
        await markAsReadLocally(conversationId);
      } catch (err) {
        console.error("Failed to retrieve conversation detail:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [connectionStatus, markAsReadLocally]
  );

  const sendMessage = useCallback(
    async (
      content?: string | null,
      mediaUrl?: string | null,
      type: MessageType = "Text",
      imageFile?: File | null
    ) => {
      const convId = activeConversationIdRef.current;
      if (!convId) return;

      try {
        const newMessage = await apiSendMessage(convId, {
          messageType: type,
          content,
          mediaUrl,
          imageFile,
        });

        // Append new message
        setMessages((prev) => [...prev, newMessage]);

        // Update sidebar list: Move this conversation to top, set last message preview
        setConversations((prev) => {
          const index = prev.findIndex((c) => c.id === convId);
          if (index === -1) return prev;
          const updatedConv = {
            ...prev[index],
            lastMessagePreview: content || "[Attachment]",
            lastActivityAt: new Date().toISOString(),
          };
          const rest = prev.filter((_, i) => i !== index);
          return [updatedConv, ...rest];
        });
      } catch (err) {
        console.error("Failed to send message:", err);
        throw err;
      }
    },
    []
  );

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await apiDeleteMessage(messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content: null, mediaUrl: null, isDeletedBySender: true } // Or mark locally
            : m
        )
      );
    } catch (err) {
      console.error("Failed to delete message:", err);
      throw err;
    }
  }, []);

  const closeConversation = useCallback(
    async (conversationId: string) => {
      try {
        await apiCloseConversation(conversationId);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, isActive: false, status: "Closed" } : c
          )
        );
        if (activeConversationIdRef.current === conversationId) {
          selectConversation(conversationId); // Refresh details
        }
      } catch (err) {
        console.error("Failed to close conversation:", err);
        throw err;
      }
    },
    [selectConversation]
  );

  const startConversation = useCallback(
    async (productId: string, initialMessage?: string | null) => {
      try {
        const newConv = await apiStartConversation(productId, { initialMessage });
        await fetchConversations();
        await selectConversation(newConv.id);
        return newConv;
      } catch (err) {
        console.error("Failed to start conversation:", err);
        throw err;
      }
    },
    [fetchConversations, selectConversation]
  );

  // ─── SignalR Lifecycle ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) {
      // Disconnect if user logs out
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
      setConnectionStatus("disconnected");
      return;
    }

    // Load conversations list initially
    fetchConversations();

    setConnectionStatus("connecting");

    const hub = new HubConnectionBuilder()
      .withUrl(HUB_URL, { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    // Event: Receive Message (Realtime message push)
    hub.on("ReceiveMessage", (message: MessageResponse) => {
      const activeId = activeConversationIdRef.current;

      if (message.conversationId === activeId) {
        // If we are currently chatting in this window, append it immediately
        setMessages((prev) => [...prev, message]);
        // Also call endpoint/hub to mark as read
        apiMarkAsRead(message.conversationId).catch(console.error);
      }

      // Update sidebar preview and unread counts
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === message.conversationId);
        if (index === -1) {
          // If conversation is new (e.g. other person started it), re-fetch conversations
          fetchConversations();
          return prev;
        }

        const isCurrentOpen = message.conversationId === activeId;
        const currentConv = prev[index];
        const updatedConv: ConversationResponse = {
          ...currentConv,
          lastMessagePreview: message.content || "[Attachment]",
          lastActivityAt: message.sentAt,
          unreadCount: isCurrentOpen ? 0 : currentConv.unreadCount + 1,
        };

        const rest = prev.filter((_, i) => i !== index);
        return [updatedConv, ...rest]; // Move to top
      });
    });

    // Event: Read Receipt
    hub.on(
      "ReadReceipt",
      (receipt: { conversationId: string; readByUserId: string; readAt: string }) => {
        const activeId = activeConversationIdRef.current;
        if (receipt.conversationId === activeId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.senderId !== receipt.readByUserId && !m.readAt
                ? { ...m, readAt: receipt.readAt }
                : m
            )
          );
        }
      }
    );

    // Event: Conversation Closed
    hub.on("ConversationClosed", (payload: { conversationId: string; reason: string }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === payload.conversationId ? { ...c, isActive: false, status: "Closed" } : c
        )
      );
      if (activeConversationIdRef.current === payload.conversationId) {
        // Notify or update active state
        setConversations((prev) =>
          prev.map((c) => (c.id === payload.conversationId ? { ...c, isActive: false } : c))
        );
      }
    });

    hub.onclose(() => {
      setConnectionStatus("disconnected");
    });

    hub.onreconnecting(() => {
      setConnectionStatus("connecting");
    });

    hub.onreconnected(() => {
      setConnectionStatus("connected");
      // Re-join the active conversation if we have one
      const activeId = activeConversationIdRef.current;
      if (activeId) {
        hub.invoke("JoinConversation", activeId).catch(console.error);
      }
    });

    hub
      .start()
      .then(() => {
        setConnectionStatus("connected");
        connectionRef.current = hub;

        // If we already selected a conversation before connection was live, join now
        const activeId = activeConversationIdRef.current;
        if (activeId) {
          hub.invoke("JoinConversation", activeId).catch(console.error);
        }
      })
      .catch((err) => {
        console.error("SignalR connection failed:", err);
        setConnectionStatus("error");
      });

    return () => {
      hub.stop();
      connectionRef.current = null;
    };
  }, [isAuthenticated, fetchConversations]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        connectionStatus,
        totalUnreadCount,
        fetchConversations,
        selectConversation,
        sendMessage,
        deleteMessage,
        closeConversation,
        startConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
}
