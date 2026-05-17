import { CategoryManagementPage } from "../components/CategoryManagementPage";

export default function CategoryManagementPageWrapper() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <CategoryManagementPage />
      </div>
    </div>
  );
}
