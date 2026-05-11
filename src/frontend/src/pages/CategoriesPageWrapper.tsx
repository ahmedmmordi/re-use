import { CategoryBar } from "../components/CategoryBar";
import { CategoriesPage } from "../components/CategoriesPage";

export default function CategoriesPageWrapper() {
  return (
    <div className="min-h-screen flex flex-col">
      <CategoryBar />
      <div className="flex-1">
        <CategoriesPage />
      </div>
    </div>
  );
}
