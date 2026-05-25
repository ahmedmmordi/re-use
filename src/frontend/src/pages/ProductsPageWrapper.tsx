import { useAuth } from "../context/AuthContext";
import { LoggedInNavbar } from "../components/LoggedInNavbar";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { CategoryBar } from "../components/CategoryBar";
import { ProductsPage } from "../components/ProductsPage";
import { AdminNavbar } from "../components/AdminNavbar.tsx";

export default function ProductsPageWrapper() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      {user?.role === "Admin" ? <AdminNavbar /> : user ? <LoggedInNavbar /> : <Navbar />}
      <CategoryBar />
      <div className="flex-1">
        <ProductsPage />
      </div>
      <Footer />
    </div>
  );
}
