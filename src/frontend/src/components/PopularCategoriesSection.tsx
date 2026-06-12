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
  Package,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
} from "lucide-react";
import { loadCategories, rollupProductCount } from "./data/categories";
import type { Category } from "./data/categories";

const iconMap: Record<string, React.ReactNode> = {
  User2: <User2 className="w-8 h-8" />,
  Shirt: <Shirt className="w-8 h-8" />,
  Smartphone: <Smartphone className="w-8 h-8" />,
  Dice5: <Dice5 className="w-8 h-8" />,
  Gamepad2: <Gamepad2 className="w-8 h-8" />,
  ShoppingBag: <ShoppingBag className="w-8 h-8" />,
  Lamp: <Lamp className="w-8 h-8" />,
  Mic2: <Mic2 className="w-8 h-8" />,
  Sparkles: <Sparkles className="w-8 h-8" />,
  Baby: <Baby className="w-8 h-8" />,
  Trophy: <Trophy className="w-8 h-8" />,
  Scissors: <Scissors className="w-8 h-8" />,
  Briefcase: <Briefcase className="w-8 h-8" />,
  PawPrint: <PawPrint className="w-8 h-8" />,
  Tent: <Tent className="w-8 h-8" />,
  Wrench: <Wrench className="w-8 h-8" />,
  BookOpen: <BookOpen className="w-8 h-8" />,
};

export function PopularCategoriesSection() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

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

  const popular = [...categories]
    .sort((a, b) => rollupProductCount(b) - rollupProductCount(a))
    .slice(0, 6);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  if (!isLoading && !error && popular.length === 0) return null;

  return (
    <section className="bg-gradient-to-br from-[#FAFAFA] to-[#F3F4F6] w-full">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] flex items-center justify-center text-white shadow-md">
                <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                Popular Categories
              </h2>
            </div>
            <p className="text-gray-500 text-sm sm:text-base mt-1">
              Categories with the most listings
            </p>
          </div>
          <button
            onClick={() => navigate("/categories")}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-start">
            {popular.map((category) => {
              const isExpanded = expandedCategory === category.id;
              return (
                <div
                  key={category.id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  <div
                    onClick={() => toggleCategory(category.id)}
                    className="p-5 sm:p-6 cursor-pointer hover:bg-gradient-to-br hover:from-[#F3E8FF] hover:to-[#EDE9FE] transition-all duration-300 group"
                  >
                    <div className="flex items-start gap-4 sm:gap-5">
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
                          {iconMap[category.iconName] || <Package className="w-8 h-8" />}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 group-hover:text-[#7C3AED] transition-colors">
                          {category.label}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                          {category.description}
                        </p>
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

                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-[#7C3AED] flex-shrink-0 transition-transform duration-300" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300" />
                      )}
                    </div>
                  </div>

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

        <div className="flex justify-center mt-8 sm:hidden">
          <button
            onClick={() => navigate("/categories")}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Browse all categories
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
