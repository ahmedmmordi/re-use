import { CategoryBar } from "../components/CategoryBar";
import { FavoritesPage } from "../components/FavoritesPage";

export default function FavoritesPageWrapper() {
  return (
    <div className="min-h-screen flex flex-col">
      <CategoryBar />
      <div className="flex-1">
        <FavoritesPage />
      </div>
    </div>
  );
}
