import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AdminNavbar } from "../components/AdminNavbar";
import { LoggedInNavbar } from "../components/LoggedInNavbar";
import { ChatPage } from "../components/ChatPage";

export default function ChatPageWrapper() {
  const { user } = useAuth();
  const { conversationId } = useParams<{ conversationId?: string }>();

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        {user?.role === "Admin" ? <AdminNavbar /> : <LoggedInNavbar />}
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatPage urlConversationId={conversationId} />
      </div>
    </div>
  );
}
