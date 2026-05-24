import { Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";

interface FavoriteButtonProps {
  productId: string;
  size?: "sm" | "md";
}

export function FavoriteButton({ productId, size = "md" }: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const { isFavorited, add, remove } = useFavorites();

  if (!isAuthenticated) return null;

  const favorited = isFavorited(productId);

  const dims = size === "sm" ? "w-7 h-7 sm:w-8 sm:h-8" : "w-8 h-8 sm:w-9 sm:h-9";
  const icon = size === "sm" ? "w-3.5 h-3.5 sm:w-4 sm:h-4" : "w-4 h-4 sm:w-5 sm:h-5";

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (favorited) {
        await remove(productId);
      } else {
        await add(productId);
      }
    } catch {
      // context already reverted optimistic state
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      className={`absolute top-2 sm:top-3 right-2 sm:right-3 ${dims} rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-110 transition-all z-10`}
    >
      <Heart className={`${icon} ${favorited ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
    </button>
  );
}
