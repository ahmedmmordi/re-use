import { AdminNavbar } from "../components/AdminNavbar";
import { Footer } from "../components/Footer";
import { AdminPaymentsPage } from "../components/AdminPaymentsPage";

export default function AdminPaymentsPageWrapper() {
  return (
    <div className="min-h-screen flex flex-col">
      <AdminNavbar />
      <div className="flex-1">
        <AdminPaymentsPage />
      </div>
      <Footer />
    </div>
  );
}
