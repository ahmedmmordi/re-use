import { useAuth } from "../context/AuthContext";
import { CategoryBar } from "../components/CategoryBar";
import { AccountSettingsPage } from "../components/AccountSettingsPage";
import { LoggedInNavbar } from "../components/LoggedInNavbar";
import { AdminNavbar } from "../components/AdminNavbar";
import { Footer } from "../components/Footer";

export default function AccountSettingsPageWrapper() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  return (
    <div className="min-h-screen flex flex-col">
      {isAdmin ? <AdminNavbar /> : <LoggedInNavbar />}
      {!isAdmin && <CategoryBar />}
      <div className="flex-1">
        <AccountSettingsPage />
      </div>
      <Footer />
    </div>
  );
}
