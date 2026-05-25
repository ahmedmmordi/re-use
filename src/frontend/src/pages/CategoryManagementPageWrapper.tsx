import { AdminNavbar } from "../components/AdminNavbar";
import { CategoryManagementPage } from "../components/CategoryManagementPage";

export default function CategoryManagementPageWrapper() {
  return (
    <div className="min-h-screen flex flex-col">
      <AdminNavbar />
      <div className="flex-1">
        <CategoryManagementPage />
      </div>
    </div>
  );
}
