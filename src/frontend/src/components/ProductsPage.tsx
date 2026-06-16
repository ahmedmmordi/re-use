import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, Grid3x3, List, Package, TrendingUp, X, Search } from "lucide-react";
import { loadCategories, type Category } from "./data/categories";
import { Pagination } from "./ui/Pagination";
import { FavoriteButton } from "./FavoriteButton";
import { listProducts } from "../services/productService";
import type { ProductResponse, ProductCondition, ProductType } from "../services/productService";

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
  categories: string[];
  types: ProductType[];
  location: string;
  searchQuery: string;
  isPremium: boolean | null;
}

type ViewMode = "grid" | "list";
type SortOption = "relevance" | "newest" | "price-low" | "price-high";

const EMPTY_FILTERS: FilterState = {
  minPrice: "",
  maxPrice: "",
  conditions: [],
  categories: [],
  types: [],
  location: "",
  searchQuery: "",
  isPremium: null,
};

const PRODUCT_TYPES: ProductType[] = ["Regular", "Wanted", "Swap"];
const PRODUCT_CONDITIONS: ProductCondition[] = ["New", "LikeNew", "Used", "Broken"];

function getValidValues<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  validValues: readonly T[]
): T[] {
  const valid = new Set<string>(validValues);
  return searchParams.getAll(key).filter((value): value is T => valid.has(value));
}

function getUrlState(searchParams: URLSearchParams) {
  const searchQuery = searchParams.get("search") || "";
  const pageParam = Number(searchParams.get("page"));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const viewParam = searchParams.get("view");
  const sortParam = searchParams.get("sort");
  const isPremiumParam = searchParams.get("isPremium");
  const isPremium = isPremiumParam === "true" ? true : isPremiumParam === "false" ? false : null;

  const sortBy: SortOption =
    sortParam === "price-low" || sortParam === "price-high" || sortParam === "newest"
      ? sortParam
      : sortParam === "relevance" && searchQuery.trim()
        ? "relevance"
        : searchQuery.trim()
          ? "relevance"
          : "newest";

  return {
    filters: {
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      conditions: getValidValues(searchParams, "conditions", PRODUCT_CONDITIONS),
      categories: searchParams.getAll("categoryIds").filter(Boolean),
      types: getValidValues(searchParams, "types", PRODUCT_TYPES),
      location: searchParams.get("location") || "",
      searchQuery,
      isPremium,
    },
    page,
    viewMode: viewParam === "list" ? "list" : ("grid" as ViewMode),
    sortBy,
  };
}

function writeUrlState(
  setSearchParams: ReturnType<typeof useSearchParams>[1],
  filters: FilterState,
  sortBy: SortOption,
  viewMode: ViewMode,
  page: number,
  replace = false
) {
  const next = new URLSearchParams();
  const searchQuery = filters.searchQuery.trim();
  const effectiveSortBy = !searchQuery && sortBy === "relevance" ? "newest" : sortBy;

  if (searchQuery) next.set("search", searchQuery);
  if (page > 1) next.set("page", String(page));
  if (effectiveSortBy !== (searchQuery ? "relevance" : "newest")) {
    next.set("sort", effectiveSortBy);
  }
  if (viewMode !== "grid") next.set("view", viewMode);
  if (filters.minPrice) next.set("minPrice", filters.minPrice);
  if (filters.maxPrice) next.set("maxPrice", filters.maxPrice);
  filters.categories.forEach((id) => next.append("categoryIds", id));
  filters.types.forEach((type) => next.append("types", type));
  filters.conditions.forEach((condition) => next.append("conditions", condition));
  if (filters.location.trim()) next.set("location", filters.location.trim());
  if (filters.isPremium !== null) next.set("isPremium", String(filters.isPremium));

  setSearchParams(next, { replace });
}

export function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlState = getUrlState(searchParams);

  const appliedFilters = urlState.filters;
  const sortBy = urlState.sortBy;
  const viewMode = urlState.viewMode;
  const currentPage = urlState.page;

  const [showFilters, setShowFilters] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadCategories()
      .then((cats) => {
        if (!cancelled) setAvailableCategories(cats);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const [draftFilters, setDraftFilters] = useState<FilterState>(urlState.filters);
  const [prevSearchParams, setPrevSearchParams] = useState(searchParams.toString());

  if (searchParams.toString() !== prevSearchParams) {
    setPrevSearchParams(searchParams.toString());
    setDraftFilters(urlState.filters);
    setProductsLoading(true);
  }

  useEffect(() => {
    let cancelled = false;

    const sortMap = {
      relevance: { sortBy: "Relevance" as const, sortDirection: "Desc" as const },
      newest: { sortBy: "Newest" as const, sortDirection: "Desc" as const },
      "price-low": { sortBy: "Price" as const, sortDirection: "Asc" as const },
      "price-high": { sortBy: "Price" as const, sortDirection: "Desc" as const },
    };

    const minPrice = appliedFilters.minPrice ? Number(appliedFilters.minPrice) : undefined;
    const maxPrice = appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : undefined;
    const conditions = appliedFilters.conditions.length > 0 ? appliedFilters.conditions : undefined;
    const categoryIds =
      appliedFilters.categories.length > 0 ? appliedFilters.categories : undefined;
    const types = appliedFilters.types.length > 0 ? appliedFilters.types : undefined;
    const location = appliedFilters.location.trim() || undefined;
    const searchQuery = appliedFilters.searchQuery.trim() || undefined;
    const isPremium = appliedFilters.isPremium ?? undefined;

    listProducts({
      pageNumber: currentPage,
      pageSize: 9,
      ...sortMap[sortBy],
      minPrice,
      maxPrice,
      conditions,
      categoryIds,
      types,
      location,
      searchTerm: searchQuery,
      isPremium,
    })
      .then((page) => {
        if (!cancelled) {
          setProducts(page.data);
          setTotalRecords(page.totalRecords);
          setTotalPages(page.totalPages);
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
  }, [sortBy, appliedFilters, currentPage]);

  // Live search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (appliedFilters.searchQuery !== draftFilters.searchQuery) {
        const nextSort = draftFilters.searchQuery.trim() ? "relevance" : "newest";
        writeUrlState(setSearchParams, draftFilters, nextSort, viewMode, 1, true);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [appliedFilters.searchQuery, draftFilters, setSearchParams, viewMode]);

  const applyFilters = () => {
    const nextSort = draftFilters.searchQuery.trim() && sortBy === "newest" ? "relevance" : sortBy;
    writeUrlState(setSearchParams, draftFilters, nextSort, viewMode, 1);
  };
  const resetFilters = () => {
    writeUrlState(setSearchParams, EMPTY_FILTERS, "newest", viewMode, 1);
  };
  const toggleCondition = (cond: ProductCondition) => {
    setDraftFilters((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(cond)
        ? prev.conditions.filter((c) => c !== cond)
        : [...prev.conditions, cond],
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setDraftFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((c) => c !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  const toggleType = (type: ProductType) => {
    setDraftFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((current) => current !== type)
        : [...prev.types, type],
    }));
  };

  const updateSort = (nextSort: SortOption) => {
    writeUrlState(setSearchParams, appliedFilters, nextSort, viewMode, 1);
  };

  const updateViewMode = (nextViewMode: ViewMode) => {
    writeUrlState(setSearchParams, appliedFilters, sortBy, nextViewMode, currentPage, true);
  };

  const updatePage = (page: number) => {
    writeUrlState(setSearchParams, appliedFilters, sortBy, viewMode, page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const breadcrumbs = [
    { label: "Home", path: "/" },
    { label: "All Products", path: "" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] to-[#F3F4F6]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] py-8 sm:py-10 md:py-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6">
            <div className="flex-1 min-w-0 w-full">
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
                {appliedFilters.searchQuery
                  ? `Search Results for "${appliedFilters.searchQuery}"`
                  : "All Products"}
              </h1>
              <p className="text-white/90 text-base sm:text-lg mb-4">
                Discover pre-loved items from all categories
              </p>

              {/* Search Bar for Header */}
              <div className="relative max-w-xl mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={draftFilters.searchQuery}
                  onChange={(e) =>
                    setDraftFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-white/15 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all"
                />
                {draftFilters.searchQuery && (
                  <button
                    onClick={() => setDraftFilters((prev) => ({ ...prev, searchQuery: "" }))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>{totalRecords.toLocaleString()} items found</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Constantly updated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                onChange={(e) => updateSort(e.target.value as SortOption)}
                className="px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
              >
                {appliedFilters.searchQuery.trim() && <option value="relevance">Best Match</option>}
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
                  onClick={() => updateViewMode("grid")}
                  className={`p-1.5 sm:p-2 rounded transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white text-[#7C3AED] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => updateViewMode("list")}
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
                availableCategories={availableCategories}
                onChange={setDraftFilters}
                onToggleCondition={toggleCondition}
                onToggleCategory={toggleCategory}
                onToggleType={toggleType}
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
                <FilterSidebar
                  filters={draftFilters}
                  availableCategories={availableCategories}
                  onChange={setDraftFilters}
                  onToggleCondition={toggleCondition}
                  onToggleCategory={toggleCategory}
                  onToggleType={toggleType}
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
                <p className="text-gray-500">No products found matching your criteria.</p>
                <button
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 text-[#7C3AED] font-medium hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <>
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
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={updatePage}
                />
              </>
            ) : (
              <>
                <div className="space-y-3 sm:space-y-4">
                  {products.map((product) => (
                    <ProductListCard
                      key={product.id}
                      product={product}
                      onClick={() => navigate(`/product/${product.id}`)}
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={updatePage}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function FilterSidebar({
  filters,
  availableCategories,
  onChange,
  onToggleCondition,
  onToggleCategory,
  onToggleType,
}: {
  filters: FilterState;
  availableCategories: Category[];
  onChange: (next: FilterState) => void;
  onToggleCondition: (cond: ProductCondition) => void;
  onToggleCategory: (categoryId: string) => void;
  onToggleType: (type: ProductType) => void;
}) {
  return (
    <>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Categories</label>
        <div className="space-y-2">
          {availableCategories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.categories.includes(cat.id)}
                onChange={() => onToggleCategory(cat.id)}
                className="rounded text-[#7C3AED] focus:ring-[#7C3AED] w-4 h-4"
              />
              <span className="text-sm text-gray-700">{cat.label}</span>
            </label>
          ))}
        </div>
      </div>

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
        <label className="block text-sm font-medium text-gray-700 mb-3">Listing Type</label>
        <div className="space-y-2">
          {PRODUCT_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.types.includes(type)}
                onChange={() => onToggleType(type)}
                className="rounded text-[#7C3AED] focus:ring-[#7C3AED] w-4 h-4"
              />
              <span className="text-sm text-gray-700">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Condition</label>
        <div className="space-y-2">
          {PRODUCT_CONDITIONS.map((condition) => (
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
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Listing Status</label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.isPremium === true}
            onChange={() =>
              onChange({ ...filters, isPremium: filters.isPremium === true ? null : true })
            }
            className="rounded text-[#7C3AED] focus:ring-[#7C3AED] w-4 h-4"
          />
          <span className="text-sm text-gray-700">Premium only</span>
        </label>
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
      <div className="relative aspect-square overflow-hidden bg-gray-100">
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
          {product.isPremium && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] sm:text-xs font-medium rounded-md">
              ⭐ Premium
            </span>
          )}
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
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={product.coverImageUrl}
          alt={product.title}
          className="w-full h-full object-cover"
        />
        <FavoriteButton productId={product.id} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 line-clamp-1 group-hover:text-[#7C3AED] transition-colors">
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
          {product.isPremium && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-medium rounded-md">
              ⭐ Premium
            </span>
          )}
          {product.allowNegotiation && product.type === "Regular" && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
              Negotiable
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
