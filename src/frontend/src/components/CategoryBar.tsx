import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
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
  Grid3x3,
} from "lucide-react";
import { loadCategories } from "./data/categories";
import type { Category } from "./data/categories";
import { DressIcon } from "./icons/DressIcon";

const iconMap: Record<string, React.ReactNode> = {
  User2: <DressIcon className="w-6 h-6" />,
  Shirt: <Shirt className="w-6 h-6" />,
  Smartphone: <Smartphone className="w-6 h-6" />,
  Dice5: <Dice5 className="w-6 h-6" />,
  Gamepad2: <Gamepad2 className="w-6 h-6" />,
  ShoppingBag: <ShoppingBag className="w-6 h-6" />,
  Lamp: <Lamp className="w-6 h-6" />,
  Mic2: <Mic2 className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
  Baby: <Baby className="w-6 h-6" />,
  Trophy: <Trophy className="w-6 h-6" />,
  Scissors: <Scissors className="w-6 h-6" />,
  Briefcase: <Briefcase className="w-6 h-6" />,
  PawPrint: <PawPrint className="w-6 h-6" />,
  Tent: <Tent className="w-6 h-6" />,
  Wrench: <Wrench className="w-6 h-6" />,
  BookOpen: <BookOpen className="w-6 h-6" />,
};

export function CategoryBar() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [hoveredSubcategory, setHoveredSubcategory] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sharedCategories, setSharedCategories] = useState<Category[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadCategories()
      .then((cats) => {
        if (!cancelled) setSharedCategories(cats);
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    setTimeout(checkScroll, 300);
  };

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === "view-all") {
      navigate("/categories");
      return;
    }
    const cat = sharedCategories.find((c) => c.id === categoryId);
    if (!cat || cat.subcategories.length === 0) {
      navigate(`/category/${cat?.slug ?? categoryId}`);
      return;
    }
    if (activeCategory === categoryId && showDropdown) {
      setShowDropdown(false);
      setActiveCategory(null);
    } else {
      setActiveCategory(categoryId);
      setShowDropdown(true);
    }
    setHoveredSubcategory(null);
  };

  const handleClickOutside = () => {
    setShowDropdown(false);
    setActiveCategory(null);
    setHoveredSubcategory(null);
  };

  const handleSubcategoryClick = (categoryId: string, subcategoryId: string) => {
    const cat = sharedCategories.find((c) => c.id === categoryId);
    const sub = cat?.subcategories.find((s) => s.id === subcategoryId);
    navigate(`/category/${sub?.slug ?? subcategoryId}`);
    handleClickOutside();
  };

  const handleViewAllCategory = (categoryId: string) => {
    const cat = sharedCategories.find((c) => c.id === categoryId);
    navigate(`/category/${cat?.slug ?? categoryId}`);
    handleClickOutside();
  };

  const activeCategoryData = sharedCategories.find((cat) => cat.id === activeCategory);
  const hoveredSubcategoryData = activeCategoryData?.subcategories.find(
    (sub) => sub.id === hoveredSubcategory
  );

  return (
    <div className="bg-white border-b border-[#E5E7EB] w-full relative z-[40]">
      {/* Category Bar */}
      <div className="w-full relative">
        {/* Left scroll arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-r from-white via-white/90 to-transparent flex items-center justify-start pl-1"
          >
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
        )}

        {/* Right scroll arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-l from-white via-white/90 to-transparent flex items-center justify-end pr-1"
          >
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="h-16 overflow-x-auto overflow-y-hidden px-10 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex items-center justify-between h-full gap-4 max-w-[1440px] mx-auto min-w-max">
            {sharedCategories.map((category) => {
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`flex flex-col items-center justify-center gap-1.5 px-2 py-1.5 min-w-[60px] max-w-[70px] cursor-pointer transition-all duration-200 rounded-lg group flex-shrink-0 ${
                    isActive ? "text-[#7C3AED] bg-[#F3E8FF]" : "text-[#374151] hover:bg-[#F3F4F6]"
                  }`}
                >
                  <div
                    className={`transition-colors duration-200 ${isActive ? "text-[#7C3AED]" : "text-[#374151] group-hover:text-[#1F2937]"}`}
                  >
                    {iconMap[category.iconName] || <Grid3x3 className="w-6 h-6" />}
                  </div>
                  <span
                    className={`text-xs font-medium whitespace-nowrap tracking-[0.1px] ${
                      isActive
                        ? "text-[#7C3AED] font-semibold"
                        : "text-[#374151] group-hover:text-[#1F2937]"
                    }`}
                  >
                    {category.label}
                  </span>
                </button>
              );
            })}

            {/* View All button */}
            <button
              onClick={() => navigate("/categories")}
              className="flex flex-col items-center justify-center gap-1.5 px-2 py-1.5 min-w-[60px] max-w-[70px] cursor-pointer transition-all duration-200 rounded-lg group flex-shrink-0 text-[#374151] hover:bg-[#F3F4F6] border border-[#D1D5DB]"
            >
              <div className="transition-colors duration-200 text-[#374151] group-hover:text-[#1F2937]">
                <Grid3x3 className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium whitespace-nowrap tracking-[0.1px] text-[#374151] group-hover:text-[#1F2937]">
                View all
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown Overlay */}
      {showDropdown && activeCategoryData && (
        <>
          <div className="fixed inset-0 z-[997]" onClick={handleClickOutside}></div>

          <div
            className="absolute top-full left-0 right-0 bg-white border-t border-b border-[#E5E5E5] z-[998] animate-in fade-in slide-in-from-top-2 duration-200"
            style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}
          >
            <div className="max-w-[1200px] mx-auto py-8 px-6 grid grid-cols-[320px_1fr] gap-6 min-h-[400px]">
              {/* Level 1: Main Subcategories */}
              <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded-lg p-5">
                <h3
                  className="text-[17px] font-semibold text-[#222222] mb-4 pb-3 border-b border-[#E8E8E8]"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  {activeCategoryData.label}
                </h3>
                <div className="flex flex-col gap-0.5">
                  {activeCategoryData.subcategories.map((subcategory) => {
                    const isSubActive = hoveredSubcategory === subcategory.id;
                    return (
                      <button
                        key={subcategory.id}
                        onMouseEnter={() => setHoveredSubcategory(subcategory.id)}
                        onClick={() =>
                          handleSubcategoryClick(activeCategoryData.id, subcategory.id)
                        }
                        className={`flex items-center justify-between py-2.5 px-3.5 rounded-md text-[15px] transition-all duration-150 ${
                          isSubActive
                            ? "bg-white shadow-md text-[#7C3AED] font-medium border-l-[3px] border-[#7C3AED] pl-[11px] translate-x-1"
                            : "text-[#333333] hover:bg-white hover:shadow-sm hover:translate-x-1"
                        }`}
                        style={{ lineHeight: "1.4" }}
                      >
                        <span>{subcategory.label}</span>
                        <span className="text-xs text-gray-400">
                          {subcategory.productCount.toLocaleString()}
                        </span>
                      </button>
                    );
                  })}

                  {/* View All in Category */}
                  <button
                    onClick={() => handleViewAllCategory(activeCategoryData.id)}
                    className="mt-3 pt-3 border-t border-[#E8E8E8] flex items-center justify-between py-2.5 px-3.5 rounded-md text-[15px] font-semibold text-[#7C3AED] hover:bg-[#F3E8FF] transition-all duration-150"
                  >
                    <span>View All {activeCategoryData.label}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Level 2: Subcategory Details */}
              {hoveredSubcategoryData ? (
                <div
                  className="bg-white border border-[#F5F5F5] rounded-lg p-5 animate-in slide-in-from-right-4 fade-in duration-150"
                  onMouseEnter={() => setHoveredSubcategory(hoveredSubcategoryData.id)}
                >
                  <h4 className="text-[17px] font-semibold text-[#222] mb-2">
                    {hoveredSubcategoryData.label}
                  </h4>
                  <p className="text-sm text-gray-500 mb-4 pb-4 border-b border-[#F0F0F0]">
                    {hoveredSubcategoryData.productCount.toLocaleString()} items available
                  </p>

                  {hoveredSubcategoryData.nestedItems &&
                    hoveredSubcategoryData.nestedItems.length > 0 && (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-y-1 gap-x-5 mb-4">
                        {hoveredSubcategoryData.nestedItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() =>
                              handleSubcategoryClick(
                                activeCategoryData.id,
                                hoveredSubcategoryData.id
                              )
                            }
                            className="py-2 px-3 rounded text-[14px] text-left transition-all duration-150 text-[#4D4D4D] hover:bg-[#F3E8FF] hover:text-[#7C3AED]"
                            style={{ lineHeight: "1.5" }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}

                  <button
                    onClick={() =>
                      handleSubcategoryClick(activeCategoryData.id, hoveredSubcategoryData.id)
                    }
                    className="text-[14px] font-semibold text-[#7C3AED] hover:underline"
                  >
                    Browse all in {hoveredSubcategoryData.label} →
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center text-gray-400 text-sm">
                  <p>Hover over a subcategory to see more details</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
