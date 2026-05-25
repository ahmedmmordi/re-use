import { useAuth } from "../context/AuthContext";
import { AdminNavbar } from "../components/AdminNavbar";
import { LoggedInNavbar } from "../components/LoggedInNavbar";
import { Footer } from "../components/Footer";
import { CategoryBar } from "../components/CategoryBar";
import { FavoritesPage } from "../components/FavoritesPage";

export default function FavoritesPageWrapper() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      {user?.role === "Admin" ? <AdminNavbar /> : <LoggedInNavbar />}
      <CategoryBar />
      <div className="flex-1">
        <FavoritesPage />
      </div>
      <Footer />
    </div>
  );
}
