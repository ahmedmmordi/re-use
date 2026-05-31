import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Crown,
  Trash2,
  Calendar,
  Star,
  MoreVertical,
  RotateCcw,
  ShieldCheck,
  Loader2,
  X,
  ChevronDown,
} from "lucide-react";
import { Input } from "./ui/input";
import { Pagination } from "./ui/Pagination";
import {
  getAdminProducts,
  getAdminProductsSummary,
  deleteAdminProduct,
  restoreAdminProduct,
  changeAdminProductStatus,
  setAdminProductPremium,
  removeAdminProductPremium,
  type ProductResponse,
  type ProductStatus,
  type AdminProductsSummaryResponse,
} from "../services/productService";
import { getCategoryTree, type CategoryResponse } from "../services/categoryService";

const PAGE_SIZE = 9;
const STATUS_OPTIONS: ProductStatus[] = ["Active", "Sold", "Closed", "Deleted", "UnderReview"];

const STATUS_LABELS: Record<ProductStatus, string> = {
  Active: "Active",
  Sold: "Sold",
  Closed: "Closed",
  Deleted: "Deleted",
  UnderReview: "Under Review",
};

const PREMIUM_DURATIONS = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 180, label: "180 days" },
  { value: 365, label: "365 days" },
];

type Banner = { kind: "success"; message: string } | { kind: "error"; message: string } | null;

type DialogKind = "premium" | "removePremium" | "delete" | "status" | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

function formatPrice(product: ProductResponse): string {
  if (product.price != null) return `$${product.price.toFixed(2)}`;
  if (product.minPrice != null || product.maxPrice != null) {
    const min = product.minPrice != null ? `$${product.minPrice.toFixed(2)}` : "";
    const max = product.maxPrice != null ? `$${product.maxPrice.toFixed(2)}` : "";
    return [min, max].filter(Boolean).join(" - ") || "—";
  }
  return "—";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function statusPillVariant(status: ProductStatus): "success" | "neutral" | "danger" | "warning" {
  switch (status) {
    case "Active":
      return "success";
    case "Deleted":
      return "danger";
    case "UnderReview":
      return "warning";
    default:
      return "neutral";
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function ProductManagementPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [summary, setSummary] = useState<AdminProductsSummaryResponse | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [banner, setBanner] = useState<Banner>(null);
  const bannerTimer = useRef<number | null>(null);

  // Dialog state
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selected, setSelected] = useState<ProductResponse | null>(null);
  const [premiumDuration, setPremiumDuration] = useState(30);
  const [statusValue, setStatusValue] = useState<ProductStatus>("Active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const categoryRef = useRef<HTMLDivElement>(null);

  const selectedCategoryName = useMemo(() => {
    if (categoryFilter === "all") return "";
    for (const parent of categories) {
      const sub = (parent.subcategories ?? []).find((s) => s.id === categoryFilter);
      if (sub) return sub.name;
    }
    return "";
  }, [categoryFilter, categories]);

  // ── Banner ─────────────────────────────────────────────────────────────

  const showBanner = (b: Banner) => {
    setBanner(b);
    if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    bannerTimer.current = window.setTimeout(() => setBanner(null), 4000);
  };

  useEffect(() => {
    return () => {
      if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    };
  }, []);

  // ── Load categories once ─────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    getCategoryTree()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        /* category filter is optional */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Debounce search input ────────────────────────────────────────────────

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPageNumber(1);
    }, 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // ── Load products + summary ──────────────────────────────────────────────

  const loadProducts = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await getAdminProducts({
        pageNumber,
        pageSize: PAGE_SIZE,
        searchTerm: searchTerm || undefined,
        categoryIds: categoryFilter !== "all" ? [categoryFilter] : undefined,
        statuses: statusFilter !== "all" ? [statusFilter as ProductStatus] : undefined,
        sortBy: "Newest",
        sortDirection: "Desc",
      });
      setProducts(result.data);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const s = await getAdminProductsSummary();
      setSummary(s);
    } catch {
      /* stats are non-critical */
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, searchTerm, categoryFilter, statusFilter]);

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    if (!categoryOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [categoryOpen]);

  const refreshAll = async () => {
    await Promise.all([loadProducts(), loadSummary()]);
  };

  // ── Dialog openers ───────────────────────────────────────────────────────

  const openPremium = (product: ProductResponse) => {
    setSelected(product);
    setPremiumDuration(30);
    setDialog("premium");
    setOpenMenuId(null);
  };

  const openRemovePremium = (product: ProductResponse) => {
    setSelected(product);
    setDialog("removePremium");
    setOpenMenuId(null);
  };

  const openDelete = (product: ProductResponse) => {
    setSelected(product);
    setDialog("delete");
    setOpenMenuId(null);
  };

  const openStatus = (product: ProductResponse) => {
    setSelected(product);
    setStatusValue(product.status);
    setDialog("status");
    setOpenMenuId(null);
  };

  const closeDialog = () => {
    if (isSubmitting) return;
    setDialog(null);
    setSelected(null);
  };

  // ── Mutations ────────────────────────────────────────────────────────────

  const runMutation = async (fn: () => Promise<void>, successMessage: string) => {
    setIsSubmitting(true);
    try {
      await fn();
      setDialog(null);
      setSelected(null);
      await refreshAll();
      showBanner({ kind: "success", message: successMessage });
    } catch (err) {
      showBanner({ kind: "error", message: getErrorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePremium = () => {
    if (!selected) return;
    runMutation(
      () => setAdminProductPremium(selected.id, premiumDuration),
      "Product promoted to premium"
    );
  };

  const handleRemovePremium = () => {
    if (!selected) return;
    runMutation(() => removeAdminProductPremium(selected.id), "Premium status removed");
  };

  const handleDelete = () => {
    if (!selected) return;
    runMutation(() => deleteAdminProduct(selected.id), "Product deleted");
  };

  const handleRestore = (product: ProductResponse) => {
    setOpenMenuId(null);
    runMutation(() => restoreAdminProduct(product.id), "Product restored");
  };

  const handleStatus = () => {
    if (!selected) return;
    runMutation(() => changeAdminProductStatus(selected.id, statusValue), "Product status updated");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Product Management
            </h1>
            <p className="text-gray-600 text-base md:text-lg">
              Manage, moderate and promote marketplace products
            </p>
          </div>
        </div>

        {/* Banner */}
        {banner && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 ${
              banner.kind === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {banner.kind === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{banner.message}</span>
            <button
              onClick={() => setBanner(null)}
              className="ml-auto text-current/60 hover:text-current"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <StatCard
            label="Total Products"
            value={(summary?.totalProducts ?? 0).toLocaleString()}
            hint="All statuses"
            icon={<Package className="w-5 h-5 text-blue-600" />}
          />
          <StatCard
            label="Active"
            value={(summary?.activeCount ?? 0).toLocaleString()}
            hint="Live listings"
            icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
          />
          <StatCard
            label="Under Review"
            value={(summary?.underReviewCount ?? 0).toLocaleString()}
            hint="Needs attention"
            icon={<AlertTriangle className="w-5 h-5 text-yellow-600" />}
          />
          <StatCard
            label="Deleted"
            value={(summary?.deletedCount ?? 0).toLocaleString()}
            hint="Soft-deleted"
            icon={<Trash2 className="w-5 h-5 text-red-600" />}
          />
        </div>

        {/* Filters */}
        <div className="p-4 md:p-6 bg-white border border-gray-100 rounded-xl shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products by title..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-12 h-12 bg-gray-50 border-gray-200"
              />
            </div>

            <div className="relative w-full md:w-[220px]" ref={categoryRef}>
              <div
                onClick={() => {
                  setCategoryOpen(true);
                  setCategorySearch("");
                }}
                className={`flex items-center justify-between w-full border rounded-md px-3 h-12 text-sm cursor-text transition-[color,box-shadow] bg-gray-50 ${
                  categoryOpen ? "border-[#3d2e7c] ring-[3px] ring-[#3d2e7c]/20" : "border-gray-200"
                }`}
              >
                {categoryOpen ? (
                  <input
                    autoFocus
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder="Search categories..."
                    className="flex-1 outline-none bg-transparent text-sm"
                  />
                ) : (
                  <span className={selectedCategoryName ? "text-gray-700" : "text-gray-400"}>
                    {selectedCategoryName || "All Categories"}
                  </span>
                )}
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
              {categoryOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-md max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter("all");
                      setPageNumber(1);
                      setCategoryOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                      categoryFilter === "all"
                        ? "text-[#3d2e7c] font-medium bg-purple-50"
                        : "text-gray-500"
                    }`}
                  >
                    All Categories
                  </button>
                  {(() => {
                    const filtered = categories
                      .map((parent) => ({
                        ...parent,
                        matchingSubs: (parent.subcategories ?? []).filter((sub) =>
                          sub.name.toLowerCase().includes(categorySearch.toLowerCase())
                        ),
                      }))
                      .filter((parent) => parent.matchingSubs.length > 0);
                    return filtered.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No categories found</p>
                    ) : (
                      filtered.map((parent) => (
                        <div key={parent.id}>
                          <p className="text-xs text-gray-400 font-semibold px-3 pt-3 pb-1">
                            {parent.name}
                          </p>
                          {parent.matchingSubs.map((sub) => (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                setCategoryFilter(sub.id);
                                setPageNumber(1);
                                setCategoryOpen(false);
                                setCategorySearch("");
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                                categoryFilter === sub.id
                                  ? "text-[#3d2e7c] font-medium bg-purple-50"
                                  : "text-gray-900"
                              }`}
                            >
                              {sub.name}
                            </button>
                          ))}
                        </div>
                      ))
                    );
                  })()}
                </div>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPageNumber(1);
              }}
              className="w-full md:w-[200px] h-12 px-3 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none focus:border-[#3d2e7c]"
            >
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="p-16 text-center bg-white border border-gray-100 rounded-xl">
            <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading products…</p>
          </div>
        ) : loadError ? (
          <div className="p-16 text-center bg-white border border-red-200 rounded-xl">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600">{loadError}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center bg-white border border-gray-100 rounded-xl">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No products found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isMenuOpen={openMenuId === product.id}
                onToggleMenu={() =>
                  setOpenMenuId((prev) => (prev === product.id ? null : product.id))
                }
                onCloseMenu={() => setOpenMenuId(null)}
                onView={() => navigate(`/product/${product.id}`)}
                onPremium={() => openPremium(product)}
                onRemovePremium={() => openRemovePremium(product)}
                onStatus={() => openStatus(product)}
                onDelete={() => openDelete(product)}
                onRestore={() => handleRestore(product)}
                onSellerClick={() => navigate(`/profile/${product.ownerUserId}`)}
              />
            ))}
          </div>
        )}

        {!isLoading && !loadError && (
          <Pagination
            currentPage={pageNumber}
            totalPages={totalPages}
            onPageChange={setPageNumber}
          />
        )}
      </div>

      {/* Promote to premium dialog */}
      <Modal
        open={dialog === "premium"}
        onClose={closeDialog}
        title="Promote to Premium"
        description={
          selected
            ? `Feature "${selected.title}" as a premium listing. Choose how long it stays premium.`
            : ""
        }
      >
        <div className="space-y-4 py-2">
          <label className="text-sm font-medium text-gray-700 block">Duration</label>
          <select
            value={premiumDuration}
            onChange={(e) => setPremiumDuration(Number(e.target.value))}
            className="w-full h-11 px-3 rounded-md bg-white border border-gray-300 text-sm text-gray-700 outline-none focus:border-[#3d2e7c]"
          >
            {PREMIUM_DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <ModalFooter>
          <SecondaryButton onClick={closeDialog} disabled={isSubmitting}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={handlePremium} disabled={isSubmitting} loading={isSubmitting}>
            <Crown className="w-4 h-4 mr-2" />
            Promote
          </PrimaryButton>
        </ModalFooter>
      </Modal>

      {/* Remove premium dialog */}
      <Modal
        open={dialog === "removePremium"}
        onClose={closeDialog}
        title="Remove Premium Status"
        description={
          selected
            ? `Remove premium status from "${selected.title}"? It will return to a regular listing.`
            : ""
        }
      >
        <ModalFooter>
          <SecondaryButton onClick={closeDialog} disabled={isSubmitting}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            onClick={handleRemovePremium}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Remove Premium
          </PrimaryButton>
        </ModalFooter>
      </Modal>

      {/* Change status dialog */}
      <Modal
        open={dialog === "status"}
        onClose={closeDialog}
        title="Change Status"
        description={selected ? `Update the status of "${selected.title}".` : ""}
      >
        <div className="space-y-4 py-2">
          <label className="text-sm font-medium text-gray-700 block">Status</label>
          <select
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value as ProductStatus)}
            className="w-full h-11 px-3 rounded-md bg-white border border-gray-300 text-sm text-gray-700 outline-none focus:border-[#3d2e7c]"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <ModalFooter>
          <SecondaryButton onClick={closeDialog} disabled={isSubmitting}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={handleStatus} disabled={isSubmitting} loading={isSubmitting}>
            <ShieldCheck className="w-4 h-4 mr-2" />
            Update Status
          </PrimaryButton>
        </ModalFooter>
      </Modal>

      {/* Delete dialog */}
      <Modal
        open={dialog === "delete"}
        onClose={closeDialog}
        title="Delete Product"
        description={
          selected
            ? `Are you sure you want to delete "${selected.title}"? It will be soft-deleted and can be restored later.`
            : ""
        }
      >
        <ModalFooter>
          <SecondaryButton onClick={closeDialog} disabled={isSubmitting}>
            Cancel
          </SecondaryButton>
          <button
            onClick={handleDelete}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete Product
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// ─── Product card ────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: ProductResponse;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onView: () => void;
  onPremium: () => void;
  onRemovePremium: () => void;
  onStatus: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onSellerClick: () => void;
}

function ProductCard({
  product,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onView,
  onPremium,
  onRemovePremium,
  onStatus,
  onDelete,
  onRestore,
  onSellerClick,
}: ProductCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300">
      {/* Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden rounded-t-xl">
        {product.coverImageUrl ? (
          <img
            src={product.coverImageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-300" />
          </div>
        )}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
          {product.isPremium && (
            <Pill variant="premium">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Pill>
          )}
          <Pill variant={statusPillVariant(product.status)}>{STATUS_LABELS[product.status]}</Pill>
        </div>
      </div>

      {/* Details */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3
            className="font-bold text-gray-900 text-lg line-clamp-2 flex-1 cursor-pointer hover:text-[#3d2e7c] transition-colors"
            onClick={onView}
          >
            {product.title}
          </h3>
          <div className="relative ml-2">
            <button
              onClick={onToggleMenu}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="More actions"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={onCloseMenu} aria-hidden="true" />
                <div className="absolute right-0 mt-2 w-52 z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1">
                  <MenuItem
                    icon={<Eye className="w-4 h-4" />}
                    label="View Product"
                    onClick={onView}
                  />
                  {product.isPremium ? (
                    <MenuItem
                      icon={<Crown className="w-4 h-4" />}
                      label="Remove Premium"
                      onClick={onRemovePremium}
                    />
                  ) : (
                    product.status !== "Deleted" && (
                      <MenuItem
                        icon={<Crown className="w-4 h-4" />}
                        label="Promote to Premium"
                        onClick={onPremium}
                      />
                    )
                  )}
                  <MenuItem
                    icon={<ShieldCheck className="w-4 h-4" />}
                    label="Change Status"
                    onClick={onStatus}
                  />
                  {product.status === "Deleted" && (
                    <MenuItem
                      icon={<RotateCcw className="w-4 h-4" />}
                      label="Restore Product"
                      onClick={onRestore}
                    />
                  )}
                  <div className="my-1 border-t border-gray-100" />
                  <MenuItem
                    icon={<Trash2 className="w-4 h-4" />}
                    label="Delete Product"
                    onClick={onDelete}
                    danger
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Seller */}
        <div
          className="flex items-center gap-2 mb-4 cursor-pointer hover:opacity-75 transition-opacity w-fit"
          onClick={onSellerClick}
        >
          {product.sellerAvatarUrl ? (
            <img
              src={product.sellerAvatarUrl}
              alt={product.sellerName}
              className="w-6 h-6 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
              {(product.sellerName?.[0] ?? "?").toUpperCase()}
            </span>
          )}
          <span className="text-sm text-gray-600 truncate">{product.sellerName || "Unknown"}</span>
        </div>

        {/* Price & category */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-2xl font-bold text-[#3d2e7c]">{formatPrice(product)}</p>
          {product.categoryName && <Pill variant="outline">{product.categoryName}</Pill>}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            {product.favoritesCount}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(product.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600 font-medium">{label}</span>
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {hint && <p className="text-sm text-gray-500 mt-2">{hint}</p>}
    </div>
  );
}

function Pill({
  variant,
  children,
}: {
  variant: "outline" | "success" | "neutral" | "danger" | "warning" | "premium";
  children: React.ReactNode;
}) {
  const styles = {
    success: "bg-green-100 text-green-700 border-green-200",
    neutral: "bg-gray-100 text-gray-700 border-gray-200",
    danger: "bg-red-100 text-red-700 border-red-200",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
    premium:
      "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-transparent shadow-sm",
    outline: "bg-white text-gray-700 border-gray-300",
  }[variant];
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md border ${styles}`}
    >
      {children}
    </span>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
        danger ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ─── Modal primitive ─────────────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Modal({ open, onClose, title, description, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-[550px] bg-white rounded-xl shadow-2xl border border-gray-100 p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">{children}</div>
  );
}

function PrimaryButton({
  onClick,
  disabled,
  loading,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

function SecondaryButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
    >
      {children}
    </button>
  );
}
