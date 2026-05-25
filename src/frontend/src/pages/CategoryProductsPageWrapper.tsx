import { useAuth } from "../context/AuthContext";
import { LoggedInNavbar } from "../components/LoggedInNavbar";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { CategoryBar } from "../components/CategoryBar";
import { CategoryProductsPage } from "../components/CategoryProductsPage";
import { AdminNavbar } from "../components/AdminNavbar.tsx";

export default function CategoryProductsPageWrapper() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      {user?.role === "Admin" ? <AdminNavbar /> : user ? <LoggedInNavbar /> : <Navbar />}
      <CategoryBar />
      <div className="flex-1">
        <CategoryProductsPage />
      </div>
      <Footer />
    </div>
  );
}
