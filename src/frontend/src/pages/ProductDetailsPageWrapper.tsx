import { useAuth } from "../context/AuthContext";
import { LoggedInNavbar } from "../components/LoggedInNavbar";
import { Navbar } from "../components/Navbar";
import { AdminNavbar } from "../components/AdminNavbar";
import { ProductDetailsPage } from "../components/ProductDetailsPage";
import { Footer } from "../components/Footer";

export default function ProductDetailsPageWrapper() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      {user?.role === "Admin" ? <AdminNavbar /> : user ? <LoggedInNavbar /> : <Navbar />}
      <div className="flex-1">
        <ProductDetailsPage />
      </div>
      <Footer />
    </div>
  );
}
