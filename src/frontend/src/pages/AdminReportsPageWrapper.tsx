import { AdminNavbar } from "../components/AdminNavbar";
import { Footer } from "../components/Footer";
import { AdminReportsPage } from "../components/AdminReportsPage";

export default function AdminReportsPageWrapper() {
  return (
    <div className="min-h-screen flex flex-col">
      <AdminNavbar />
      <div className="flex-1">
        <AdminReportsPage />
      </div>
      <Footer />
    </div>
  );
}
