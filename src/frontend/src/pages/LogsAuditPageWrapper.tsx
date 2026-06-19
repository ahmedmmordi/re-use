import { AdminNavbar } from "../components/AdminNavbar";
import { Footer } from "../components/Footer";
import { LogsAuditPage } from "../components/LogsAuditPage";

export default function LogsAuditPageWrapper() {
  return (
    <div className="min-h-screen flex flex-col">
      <AdminNavbar />
      <div className="flex-1">
        <LogsAuditPage />
      </div>
      <Footer />
    </div>
  );
}
