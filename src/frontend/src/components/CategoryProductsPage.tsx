import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Heart,
  HeartOff,
  SlidersHorizontal,
  Grid3x3,
  List,
  Package,
  TrendingUp,
  X,
} from "lucide-react";
import { fetchCategoryBySlugOrId, getParentCategory, rollupProductCount } from "./data/categories";
import type { Category } from "./data/categories";
import { listProducts } from "../services/productService";
import type { ProductResponse, ProductCondition } from "../services/productService";
import {
  getFollowedCategories,
  followCategory,
  unfollowCategory,
} from "../services/categoryFollowService";
import { useAuth } from "../context/AuthContext";
import { FavoriteButton } from "./FavoriteButton";

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

interface FilterState {
  minPrice: string;
  maxPrice: string;
  conditions: ProductCondition[];
  location: string;
}

const EMPTY_FILTERS: FilterState = {
  minPrice: "",
  maxPrice: "",
  conditions: [],
  location: "",
};

export function CategoryProductsPage() {
  const { categoryId: slugOrId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">("newest");
  const [showFilters, setShowFilters] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [parent, setParent] = useState<Category | undefined>(undefined);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [draftFilters, setDraftFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(EMPTY_FILTERS);

  useEffect(() => {
    let cancelled = false;
    if (!slugOrId) return;
    fetchCategoryBySlugOrId(slugOrId)
      .then((c) => {
        if (!cancelled) {
          setCategory(c);
          setParent(c ? getParentCategory(c) : undefined);
          setCategoryLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategory(undefined);
          setParent(undefined);
          setCategoryLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slugOrId]);

  useEffect(() => {
    let cancelled = false;
    if (!category) return;

    const sortMap = {
      newest: { sortBy: "Newest" as const, sortDirection: "Desc" as const },
      "price-low": { sortBy: "Price" as const, sortDirection: "Asc" as const },
      "price-high": { sortBy: "Price" as const, sortDirection: "Desc" as const },
    };

    const minPrice = appliedFilters.minPrice ? Number(appliedFilters.minPrice) : undefined;
    const maxPrice = appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : undefined;
    const conditions = appliedFilters.conditions.length > 0 ? appliedFilters.conditions : undefined;
    const location = appliedFilters.location.trim() || undefined;

    listProducts({
      categoryIds: [category.id],
      pageSize: 9,
      ...sortMap[sortBy],
      minPrice,
      maxPrice,
      conditions,
      location,
    })
      .then((page) => {
        if (!cancelled) {
          setProducts(page.data);
          setTotalRecords(page.totalRecords);
          setProductsError(null);
          setProductsLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setProductsError(err.message);
          setProductsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [category, sortBy, appliedFilters]);

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated || !category) return;
    getFollowedCategories()
      .then((page) => {
        if (!cancelled) {
          setIsFollowing(page.data.some((f) => f.categoryId === category.id));
        }
      })
      .catch(() => {
        if (!cancelled) setIsFollowing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, category]);

  const toggleFollow = async () => {
    if (!category || followBusy) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setFollowBusy(true);
    try {
      if (isFollowing) {
        await unfollowCategory(category.id);
        setIsFollowing(false);
      } else {
        await followCategory(category.id);
        setIsFollowing(true);
      }
    } catch {
      // ignore
    } finally {
      setFollowBusy(false);
    }
  };

  const applyFilters = () => setAppliedFilters(draftFilters);
  const resetFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };
  const toggleCondition = (cond: ProductCondition) => {
    setDraftFilters((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(cond)
        ? prev.conditions.filter((c) => c !== cond)
        : [...prev.conditions, cond],
    }));
  };

  const categoryName = category?.label || "Category";
  const categoryDescription = category?.description || "Discover unique, pre-loved items";
  const productCount = category ? rollupProductCount(category) : 0;

  const breadcrumbs = [
    { label: "Categories", path: "/categories" },
    ...(parent ? [{ label: parent.label, path: `/category/${parent.slug}` }] : []),
    ...(category ? [{ label: category.label, path: "" }] : []),
  ];

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] to-[#F3F4F6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading category...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] to-[#F3F4F6] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Category not found</h2>
          <p className="text-gray-500 mb-6">The category you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/categories")}
            className="px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Browse All Categories
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] to-[#F3F4F6]">
      {/* Category Header */}
      <div className="bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] py-8 sm:py-10 md:py-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
            <div className="flex-1 min-w-0">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 mb-3 flex-wrap">
                {breadcrumbs.map((crumb, idx) => (
                  <span key={idx} className="flex items-center gap-2">
                    {idx > 0 && <span className="text-white/50">/</span>}
                    {crumb.path ? (
                      <button
                        onClick={() => navigate(crumb.path)}
                        className="text-white/80 hover:text-white text-sm font-medium transition-colors"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="text-white font-medium text-sm">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>

              <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-semibold mb-2 sm:mb-3">
                {categoryName}
              </h1>
              <p className="text-white/90 text-base sm:text-lg mb-4">{categoryDescription}</p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>{productCount.toLocaleString()} items</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Trending category</span>
                </div>
              </div>
            </div>

            {/* Follow Button */}
            <button
              onClick={toggleFollow}
              disabled={followBusy}
              className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all duration-200 flex-shrink-0 ${
                isFollowing
                  ? "bg-white/20 text-white hover:bg-white/30"
                  : "bg-white text-[#7C3AED] hover:shadow-lg hover:scale-105"
              }`}
            >
              {isFollowing ? (
                <>
                  <HeartOff className="w-5 h-5" />
                  <span className="hidden sm:inline">Unfollow</span>
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5" />
                  <span className="hidden sm:inline">Follow Category</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Subcategory Pills */}
      {category.subcategories.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-3">
            <div
              className="flex items-center gap-2 overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
            >
              <span className="text-sm text-gray-500 flex-shrink-0 mr-1">Subcategories:</span>
              {category.subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => navigate(`/category/${sub.slug}`)}
                  className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium bg-[#F3E8FF] text-[#7C3AED] hover:bg-[#E8D5FF] transition-all whitespace-nowrap"
                >
                  {sub.label}
                  <span className="ml-1.5 text-xs text-[#7C3AED]/70">
                    {sub.productCount.toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters and View Controls */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setShowMobileSidebar(true);
                  } else {
                    setShowFilters(!showFilters);
                  }
                }}
                className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                  showFilters
                    ? "bg-[#7C3AED] text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>

              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-600 mr-1 sm:mr-2 hidden sm:inline">
                {totalRecords.toLocaleString()} results
              </span>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 sm:p-2 rounded transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white text-[#7C3AED] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 sm:p-2 rounded transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-white text-[#7C3AED] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[360px] bg-white shadow-xl animate-in slide-in-from-left duration-300 overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <FilterSidebar
                filters={draftFilters}
                onChange={setDraftFilters}
                onToggleCondition={toggleCondition}
              />

              <div className="flex gap-3 pt-4 border-t border-gray-200 mt-4">
                <button
                  onClick={resetFilters}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    applyFilters();
                    setShowMobileSidebar(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        <div className="flex gap-6 md:gap-8">
          {showFilters && (
            <div className="w-72 xl:w-80 flex-shrink-0 hidden md:block">
              <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                {category.subcategories.length > 0 && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Browse
                    </h4>
                    <div className="space-y-0.5">
                      {category.subcategories.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => navigate(`/category/${sub.slug}`)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-all"
                        >
                          <span>{sub.label}</span>
                          <span className="text-xs text-gray-400">
                            {sub.productCount.toLocaleString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <FilterSidebar
                  filters={draftFilters}
                  onChange={setDraftFilters}
                  onToggleCondition={toggleCondition}
                />

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={resetFilters}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={applyFilters}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Products area */}
          <div className="flex-1 min-w-0">
            {productsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : productsError ? (
              <div className="text-center py-20">
                <p className="text-red-500 mb-4">{productsError}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No products in this category yet.</p>
              </div>
            ) : viewMode === "grid" ? (
              <div
                className={`grid gap-4 sm:gap-5 md:gap-6 ${
                  showFilters
                    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                }`}
              >
                {products.map((product) => (
                  <ProductGridCard
                    key={product.id}
                    product={product}
                    onClick={() => navigate(`/product/${product.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {products.map((product) => (
                  <ProductListCard
                    key={product.id}
                    product={product}
                    onClick={() => navigate(`/product/${product.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSidebar({
  filters,
  onChange,
  onToggleCondition,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onToggleCondition: (cond: ProductCondition) => void;
}) {
  const conditions: ProductCondition[] = ["New", "LikeNew", "Used", "Broken"];
  return (
    <>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Price Range</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
          />
          <span className="text-gray-500">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Condition</label>
        <div className="space-y-2">
          {conditions.map((condition) => (
            <label key={condition} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.conditions.includes(condition)}
                onChange={() => onToggleCondition(condition)}
                className="rounded text-[#7C3AED] focus:ring-[#7C3AED] w-4 h-4"
              />
              <span className="text-sm text-gray-700">{CONDITION_LABELS[condition]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Location</label>
        <input
          type="text"
          placeholder="Enter city or country"
          value={filters.location}
          onChange={(e) => onChange({ ...filters, location: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
        />
      </div>
    </>
  );
}

function ProductGridCard({ product, onClick }: { product: ProductResponse; onClick: () => void }) {
  const conditionLabel = product.condition ? CONDITION_LABELS[product.condition] : "";
  return (
    <div
      className="bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-100"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.coverImageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

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
}

function ProductListCard({ product, onClick }: { product: ProductResponse; onClick: () => void }) {
  const conditionLabel = product.condition ? CONDITION_LABELS[product.condition] : "";
  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-3 sm:p-4 flex gap-3 sm:gap-4 cursor-pointer border border-gray-100"
      onClick={onClick}
    >
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
        <img
          src={product.coverImageUrl}
          alt={product.title}
          className="w-full h-full object-cover rounded-lg"
        />
        <FavoriteButton productId={product.id} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 line-clamp-1">
          {product.title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">
          {conditionLabel ? `${conditionLabel} • ` : ""}
          {formatLocation(product)}
        </p>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl sm:text-2xl font-bold text-[#7C3AED]">
            {formatPrice(product)}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 bg-[#F3E8FF] text-[#7C3AED] text-xs font-medium rounded-md">
            {product.type}
          </span>
        </div>
      </div>
    </div>
  );
}
