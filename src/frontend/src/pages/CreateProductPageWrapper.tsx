import { useAuth } from "../context/AuthContext";
import { AdminNavbar } from "../components/AdminNavbar";
import { LoggedInNavbar } from "../components/LoggedInNavbar";
import { Footer } from "../components/Footer";
import { CreateProductPage } from "../components/CreateProductPage";

export default function CreateProductPageWrapper() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      {user?.role === "Admin" ? <AdminNavbar /> : <LoggedInNavbar />}
      <div className="flex-1">
        <CreateProductPage />
      </div>
      <Footer />
    </div>
  );
}
