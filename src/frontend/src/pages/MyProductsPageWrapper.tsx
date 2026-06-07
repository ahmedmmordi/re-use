import { useAuth } from "../context/AuthContext";
import { AdminNavbar } from "../components/AdminNavbar";
import { LoggedInNavbar } from "../components/LoggedInNavbar";
import { Footer } from "../components/Footer";
import { CategoryBar } from "../components/CategoryBar";
import { MyProductsPage } from "../components/MyProductsPage";

export default function MyProductsPageWrapper() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      {user?.role === "Admin" ? <AdminNavbar /> : <LoggedInNavbar />}
      <CategoryBar />
      <div className="flex-1">
        <MyProductsPage />
      </div>
      <Footer />
    </div>
  );
}
