import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Package, Sparkles, Crown } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";
import { getRecommendationFeed } from "../services/recommendationService";
import type { ProductResponse } from "../services/productService";
import { useAuth } from "../context/AuthContext";

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

function isActivePremium(p: ProductResponse): boolean {
  return p.isPremium && (p.premiumExpiresAt == null || new Date(p.premiumExpiresAt) > new Date());
}

export function RecommendedSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRecommendationFeed({ pageNumber: 1, pageSize: 6 })
      .then((page) => {
        if (!cancelled) {
          setProducts(page.data);
          setIsLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isLoading && !error && products.length === 0) return null;

  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 w-full">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">
              {user ? "Recommended for You" : "Popular Right Now"}
            </h2>
          </div>
          <p className="text-gray-500 text-sm sm:text-base mt-1">
            {user ? "Picks based on your activity" : "Trending pre-loved items from the community"}
          </p>
        </div>
        <button
          onClick={() => navigate("/products")}
          className="hidden sm:flex items-center gap-2 text-[#7C3AED] font-medium hover:gap-3 transition-all"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {products.map((product) => {
            const conditionLabel = product.condition ? CONDITION_LABELS[product.condition] : "";
            const premium = isActivePremium(product);
            return (
              <div
                key={product.id}
                className={`bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer border ${
                  premium ? "border-yellow-400 ring-1 ring-yellow-300" : "border-gray-100"
                }`}
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={product.coverImageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {premium && (
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3 inline-flex items-center text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-md border border-transparent bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-sm">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </div>
                  )}
                  <FavoriteButton productId={product.id} />
                  <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm text-[#7C3AED] text-[10px] sm:text-xs font-medium rounded-md">
                      {product.type}
                    </span>
                  </div>
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
          })}
        </div>
      )}

      <div className="flex justify-center mt-8 sm:hidden">
        <button
          onClick={() => navigate("/products")}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-lg font-medium hover:shadow-lg transition-all"
        >
          <Package className="w-4 h-4" />
          Browse all products
        </button>
      </div>
    </section>
  );
}
