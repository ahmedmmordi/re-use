import { AdminNavbar } from "../components/AdminNavbar";
import { Footer } from "../components/Footer";
import { NotificationBroadcastPage } from "../components/NotificationBroadcastPage";

export default function NotificationBroadcastPageWrapper() {
  return (
    <div className="min-h-screen flex flex-col">
      <AdminNavbar />
      <div className="flex-1">
        <NotificationBroadcastPage />
      </div>
      <Footer />
    </div>
  );
}
