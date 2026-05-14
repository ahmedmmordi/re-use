import { CategoryBar } from "../components/CategoryBar";
import { ProductsPage } from "../components/ProductsPage";

export default function ProductsPageWrapper() {
  return (
    <div className="min-h-screen flex flex-col">
      <CategoryBar />
      <div className="flex-1">
        <ProductsPage />
      </div>
    </div>
  );
}
