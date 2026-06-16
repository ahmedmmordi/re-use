import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Filter, SortAsc, Package } from "lucide-react";
import { Pagination } from "./ui/Pagination";
import { getFavorites } from "../services/favoriteService";
import { useFavorites } from "../context/FavoritesContext";
import type { ProductResponse, ProductType } from "../services/productService";

const CONDITION_LABELS: Record<string, string> = {
  New: "New",
  LikeNew: "Like New",
  Used: "Used",
  Broken: "Broken",
};

function formatLocation(p: ProductResponse): string {
  const parts = [p.locationCity, p.locationCountry].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

function formatPrice(p: ProductResponse): string {
  if (p.type === "Wanted") {
    if (p.minPrice != null && p.maxPrice != null) return `$${p.minPrice} - $${p.maxPrice}`;
    if (p.maxPrice != null) return `Up to $${p.maxPrice}`;
    return "Wanted";
  }
  if (p.type === "Swap") return "Swap";
  return p.price != null ? `$${p.price}` : "—";
}

type TypeFilter = "all" | ProductType;
type SortOption = "recent" | "price-low" | "price-high";

export function FavoritesPage() {
  const navigate = useNavigate();
  const { remove, favoriteIds } = useFavorites();

  const [favorites, setFavorites] = useState<ProductResponse[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  const [removingId, setRemovingId] = useState<string | null>(null);

  // Reset to page 1 when filters/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, sortBy]);

  useEffect(() => {
    let cancelled = false;

    const sortMap = {
      recent: { sortBy: "Newest" as const, sortDirection: "Desc" as const },
      "price-low": { sortBy: "Price" as const, sortDirection: "Asc" as const },
      "price-high": { sortBy: "Price" as const, sortDirection: "Desc" as const },
    };

    const types = typeFilter === "all" ? undefined : [typeFilter];

    setLoading(true);
    getFavorites({
      pageNumber: currentPage,
      pageSize: 9,
      ...sortMap[sortBy],
      types,
    })
      .then((page) => {
        if (!cancelled) {
          setFavorites(page.data);
          setTotalRecords(page.totalRecords);
          setTotalPages(page.totalPages);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [typeFilter, sortBy, currentPage, favoriteIds]);

  const handleRemoveFavorite = async (productId: string) => {
    setRemovingId(productId);
    try {
      await remove(productId);
      setFavorites((prev) => prev.filter((p) => p.id !== productId));
      setTotalRecords((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove favorite");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] to-[#F3F4F6]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] py-8 sm:py-10 md:py-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-semibold">
                My Favorites
              </h1>
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 fill-current" />
            </div>
            <p className="text-white/90 text-sm sm:text-base">
              {totalRecords > 0
                ? `${totalRecords.toLocaleString()} saved ${totalRecords === 1 ? "item" : "items"}`
                : "No saved items yet"}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base font-medium">Filter:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="px-3 py-2 sm:py-2.5 rounded-lg border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
              >
                <option value="all">All Items</option>
                <option value="Regular">Regular</option>
                <option value="Wanted">Wanted</option>
                <option value="Swap">Swap</option>
              </select>
            </div>

            <div className="hidden sm:block h-6 w-px bg-gray-300" />

            <div className="flex items-center gap-2 text-gray-700">
              <SortAsc className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 sm:py-2.5 rounded-lg border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
              >
                <option value="recent">Recently Added</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            <div className="sm:ml-auto text-xs sm:text-sm text-gray-600">
              {totalRecords.toLocaleString()} {totalRecords === 1 ? "result" : "results"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-2xl p-8 sm:p-12 lg:p-16 text-center border border-gray-200">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
              No Favorites Yet
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto">
              Start saving items you love! Click the heart icon on any product to add it to your
              favorites.
            </p>
            <button
              onClick={() => navigate("/products")}
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-[#4B0082] to-[#3d2e7c] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm sm:text-base"
            >
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              Browse Products
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((product) => (
                <FavoriteCard
                  key={product.id}
                  product={product}
                  removing={removingId === product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  onRemove={() => handleRemoveFavorite(product.id)}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />

            {/* Pro Tips */}
            <div className="mt-8 sm:mt-12 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-purple-200">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                💡 Pro Tips
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-gray-700 text-sm sm:text-base">
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="text-[#4B0082] mt-1">•</span>
                  <span>
                    <strong>Act Fast:</strong> Favorited items can sell quickly. Check back
                    regularly to see if they're still available.
                  </span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="text-[#4B0082] mt-1">•</span>
                  <span>
                    <strong>Compare Prices:</strong> Use sort options to find the best deal among
                    your saved items.
                  </span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="text-[#4B0082] mt-1">•</span>
                  <span>
                    <strong>Contact Sellers:</strong> Don't hesitate to message sellers with
                    questions or to make an offer.
                  </span>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FavoriteCard({
  product,
  removing,
  onClick,
  onRemove,
}: {
  product: ProductResponse;
  removing: boolean;
  onClick: () => void;
  onRemove: () => void;
}) {
  const conditionLabel = product.condition ? CONDITION_LABELS[product.condition] : "";
  return (
    <div
      className="bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-100 relative"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.coverImageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 flex flex-wrap gap-1">
          <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm text-[#7C3AED] text-[10px] sm:text-xs font-medium rounded-md">
            {product.type}
          </span>
          {product.isPremium && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] sm:text-xs font-medium rounded-md">
              ⭐ Premium
            </span>
          )}
        </div>

        {/* Remove (unfavorite) button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!removing) onRemove();
          }}
          disabled={removing}
          aria-label="Remove from favorites"
          className="absolute top-2 sm:top-3 right-2 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
        </button>
      </div>

      <div className="p-3 sm:p-4">
        <h3 className="font-medium text-gray-900 text-sm sm:text-base mb-1 line-clamp-2 group-hover:text-[#7C3AED] transition-colors">
          {product.title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 mb-2">
          {conditionLabel ? `${conditionLabel} • ` : ""}
          {formatLocation(product)}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-lg sm:text-xl font-bold text-[#7C3AED]">
            {formatPrice(product)}
          </span>
          {product.allowNegotiation && product.type === "Regular" && (
            <span className="text-xs text-gray-400">Negotiable</span>
          )}
        </div>
      </div>
    </div>
  );
}
