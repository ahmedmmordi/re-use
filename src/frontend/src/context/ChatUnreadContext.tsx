import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { getMyConversations } from "../services/conversationService";

interface ChatUnreadContextType {
  unreadConversations: number;
  refresh: () => Promise<void>;
}

const ChatUnreadContext = createContext<ChatUnreadContextType | undefined>(undefined);

export function ChatUnreadProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [unreadConversations, setUnreadConversations] = useState(0);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadConversations(0);
      return;
    }
    try {
      const res = await getMyConversations({ pageNumber: 1, pageSize: 100 });
      setUnreadConversations(res.data.filter((c) => c.unreadCount > 0).length);
    } catch {
      setUnreadConversations(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!isAuthenticated) {
        if (!cancelled) setUnreadConversations(0);
        return;
      }
      try {
        const res = await getMyConversations({ pageNumber: 1, pageSize: 100 });
        if (!cancelled) setUnreadConversations(res.data.filter((c) => c.unreadCount > 0).length);
      } catch {
        if (!cancelled) setUnreadConversations(0);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <ChatUnreadContext.Provider value={{ unreadConversations, refresh }}>
      {children}
    </ChatUnreadContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChatUnread() {
  const ctx = useContext(ChatUnreadContext);
  if (!ctx) throw new Error("useChatUnread must be used within a ChatUnreadProvider");
  return ctx;
}
