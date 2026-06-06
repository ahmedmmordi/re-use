import { AdminNavbar } from "../components/AdminNavbar";
import { Footer } from "../components/Footer";
import { UserManagementPage } from "../components/UserManagementPage";

export default function UserManagementPageWrapper() {
  return (
    <div className="min-h-screen flex flex-col">
      <AdminNavbar />
      <div className="flex-1">
        <UserManagementPage />
      </div>
      <Footer />
    </div>
  );
}
