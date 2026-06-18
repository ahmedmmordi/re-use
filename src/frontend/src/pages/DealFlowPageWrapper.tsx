import { useAuth } from "../context/AuthContext";
import { CategoryBar } from "../components/CategoryBar";
import { DealFlowPage } from "../components/DealFlowPage";
import { LoggedInNavbar } from "../components/LoggedInNavbar";
import { AdminNavbar } from "../components/AdminNavbar";

export default function DealFlowPageWrapper() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      {user?.role === "Admin" ? <AdminNavbar /> : <LoggedInNavbar />}
      <CategoryBar />
      <div className="flex-1">
        <DealFlowPage />
      </div>
    </div>
  );
}
