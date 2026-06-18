import { useAuth } from "../context/AuthContext";
import { CategoryBar } from "../components/CategoryBar";
import { ChatPage } from "../components/ChatPage";
import { LoggedInNavbar } from "../components/LoggedInNavbar";
import { AdminNavbar } from "../components/AdminNavbar";

export default function ChatPageWrapper() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      {user?.role === "Admin" ? <AdminNavbar /> : <LoggedInNavbar />}
      <CategoryBar />
      <div className="flex-1">
        <ChatPage />
      </div>
    </div>
  );
}
