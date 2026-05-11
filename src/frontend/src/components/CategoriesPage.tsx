import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User2,
  Shirt,
  Smartphone,
  Dice5,
  Gamepad2,
  ShoppingBag,
  Lamp,
  Mic2,
  Sparkles,
  Baby,
  Trophy,
  Scissors,
  Briefcase,
  PawPrint,
  Tent,
  Wrench,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Package,
  Search,
  ArrowLeft,
} from "lucide-react";
import { loadCategories, rollupProductCount } from "./data/categories";
import type { Category } from "./data/categories";

const iconMap: Record<string, React.ReactNode> = {
  User2: <User2 className="w-10 h-10" />,
  Shirt: <Shirt className="w-10 h-10" />,
  Smartphone: <Smartphone className="w-10 h-10" />,
  Dice5: <Dice5 className="w-10 h-10" />,
  Gamepad2: <Gamepad2 className="w-10 h-10" />,
  ShoppingBag: <ShoppingBag className="w-10 h-10" />,
  Lamp: <Lamp className="w-10 h-10" />,
  Mic2: <Mic2 className="w-10 h-10" />,
  Sparkles: <Sparkles className="w-10 h-10" />,
  Baby: <Baby className="w-10 h-10" />,
  Trophy: <Trophy className="w-10 h-10" />,
  Scissors: <Scissors className="w-10 h-10" />,
  Briefcase: <Briefcase className="w-10 h-10" />,
  PawPrint: <PawPrint className="w-10 h-10" />,
  Tent: <Tent className="w-10 h-10" />,
  Wrench: <Wrench className="w-10 h-10" />,
  BookOpen: <BookOpen className="w-10 h-10" />,
};

export function CategoriesPage() {
  const navigate = useNavigate();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCategories()
      .then((cats) => {
        if (!cancelled) {
          setCategories(cats);
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

  const filteredCategories = searchQuery.trim()
    ? categories.filter(
        (cat) =>
          cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.subcategories.some((sub) =>
            sub.label.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : categories;

  const totalItems = categories.reduce((sum, cat) => sum + rollupProductCount(cat), 0);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] to-[#F3F4F6]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] py-12 md:py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-semibold mb-3">
            Browse Categories
          </h1>
          <p className="text-white/90 text-base sm:text-lg mb-6">
            Explore our curated collection of pre-loved items
          </p>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/80 text-sm mb-6">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>{totalItems.toLocaleString()} total items</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{categories.length} categories</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/15 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
        {isLoading ? (
          <div className="text-center py-16 text-gray-500">Loading categories...</div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">Failed to load categories: {error}</div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg text-gray-500">No categories match "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-3 text-[#7C3AED] font-medium hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCategories.map((category) => {
              const isExpanded = expandedCategory === category.id;

              return (
                <div
                  key={category.id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCategory(category.id)}
                    className="p-5 sm:p-6 cursor-pointer hover:bg-gradient-to-br hover:from-[#F3E8FF] hover:to-[#EDE9FE] transition-all duration-300 group"
                  >
                    <div className="flex items-start gap-4 sm:gap-5">
                      {/* Cover / Icon */}
                      {category.iconUrl ? (
                        <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <img
                            src={category.iconUrl}
                            alt={category.label}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                          {iconMap[category.iconName] || <Package className="w-10 h-10" />}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 group-hover:text-[#7C3AED] transition-colors">
                          {category.label}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <Package className="w-4 h-4" />
                            <span className="font-medium">
                              {rollupProductCount(category).toLocaleString()} items
                            </span>
                          </div>
                          <span className="text-gray-300">•</span>
                          <span>{category.subcategories.length} subcategories</span>
                        </div>
                      </div>

                      {/* Expand Icon */}
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-[#7C3AED] flex-shrink-0 transition-transform duration-300" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300" />
                      )}
                    </div>
                  </div>

                  {/* Subcategories */}
                  {isExpanded && (
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2 border-t border-gray-100 bg-gradient-to-br from-[#FAFAFA] to-white animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-1">
                        {category.subcategories.map((subcategory) => (
                          <button
                            key={subcategory.id}
                            onClick={() => navigate(`/category/${subcategory.slug}`)}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-[#F3E8FF] hover:shadow-sm transition-all duration-200 text-left group"
                          >
                            <span className="text-sm font-medium text-gray-700 group-hover:text-[#7C3AED]">
                              {subcategory.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 font-medium">
                                {subcategory.productCount.toLocaleString()}
                              </span>
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#7C3AED] group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* View All Button */}
                      <button
                        onClick={() => navigate(`/category/${category.slug}`)}
                        className="w-full mt-4 py-3 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-lg font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                      >
                        View All in {category.label}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
