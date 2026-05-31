import { AdminNavbar } from "../components/AdminNavbar";
import { Footer } from "../components/Footer";
import { ProductManagementPage } from "../components/ProductManagementPage";

export default function ProductManagementPageWrapper() {
  return (
    <div className="min-h-screen flex flex-col">
      <AdminNavbar />
      <div className="flex-1">
        <ProductManagementPage />
      </div>
      <Footer />
    </div>
  );
}
