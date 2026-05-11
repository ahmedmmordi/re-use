import { CategoryBar } from "../components/CategoryBar";
import { CategoryProductsPage } from "../components/CategoryProductsPage";

export default function CategoryProductsPageWrapper() {
  return (
    <div className="min-h-screen flex flex-col">
      <CategoryBar />
      <div className="flex-1">
        <CategoryProductsPage />
      </div>
    </div>
  );
}
