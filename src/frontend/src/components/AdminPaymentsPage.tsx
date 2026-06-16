import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Crown,
  Calendar,
  Star,
  MoreVertical,
  Loader2,
  X,
  Clock,
} from "lucide-react";
import { Input } from "./ui/input";
import { Pagination } from "./ui/Pagination";
import {
  getAdminProducts,
  setAdminProductPremium,
  removeAdminProductPremium,
  type ProductResponse,
} from "../services/productService";

// TODO
// The admin product API has no server-side premium filter, so we fetch a large
// page of products and narrow to premium ones on the client.
const FETCH_PAGE_SIZE = 200;
const PAGE_SIZE = 9;
const EXPIRING_SOON_DAYS = 7;

const PREMIUM_DURATIONS = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 180, label: "180 days" },
  { value: 365, label: "365 days" },
];

// Amounts are in piasters ( * 100); each tier covers durations up to maxDays.
const PREMIUM_TIERS = [
  { maxDays: 7, amount: 4900 },
  { maxDays: 30, amount: 14900 },
  { maxDays: 90, amount: 34900 },
  { maxDays: 180, amount: 59900 },
  { maxDays: 365, amount: 99900 },
];
const PREMIUM_CURRENCY = "USD";

// Remaining-days buckets for the duration filter. "all" matches everything.
const DURATION_FILTERS = [
  { value: "all", label: "All Durations" },
  { value: "7", label: "7 days or less" },
  { value: "30", label: "30 days or less" },
  { value: "90", label: "90 days or less" },
  { value: "180", label: "180 days or less" },
  { value: "365", label: "365 days or less" },
];

type Banner = { kind: "success"; message: string } | { kind: "error"; message: string } | null;

type DialogKind = "extend" | "removePremium" | null;

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

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Whole days from now until the given date. Negative means expired.
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function expiryPillVariant(days: number | null): "success" | "warning" | "danger" | "neutral" {
  if (days === null) return "neutral";
  if (days < 0) return "danger";
  if (days <= EXPIRING_SOON_DAYS) return "warning";
  return "success";
}

function expiryLabel(days: number | null): string {
  if (days === null) return "No expiry";
  if (days < 0) return "Expired";
  if (days === 0) return "Expires today";
  return `${days} day${days === 1 ? "" : "s"} left`;
}

// Price (in piasters) for a premium product, derived from its remaining days by
// mapping to the nearest tier. Expired products contribute nothing.
function tierAmount(days: number | null): number {
  if (days === null || days < 0) return 0;
  const tier = PREMIUM_TIERS.find((t) => days <= t.maxDays);
  return tier ? tier.amount : 0;
}

function formatPiasters(piasters: number): string {
  return `${(piasters / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${PREMIUM_CURRENCY}`;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function AdminPaymentsPage() {
  const navigate = useNavigate();

  const [premiumProducts, setPremiumProducts] = useState<ProductResponse[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [durationFilter, setDurationFilter] = useState("all");
  const [pageNumber, setPageNumber] = useState(1);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [banner, setBanner] = useState<Banner>(null);
  const bannerTimer = useRef<number | null>(null);

  // Dialog state
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selected, setSelected] = useState<ProductResponse | null>(null);
  const [premiumDuration, setPremiumDuration] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // ── Debounce search input ────────────────────────────────────────────────

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearchTerm(searchInput.trim().toLowerCase());
      setPageNumber(1);
    }, 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // ── Load premium products ──────────────────────────────────────────────

  const loadProducts = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await getAdminProducts({
        pageNumber: 1,
        pageSize: FETCH_PAGE_SIZE,
        sortBy: "Newest",
        sortDirection: "Desc",
      });
      setPremiumProducts(result.data.filter((p) => p.isPremium));
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ── Derived data ───────────────────────────────────────────────────────

  const stats = useMemo(() => {
    let active = 0;
    let expiringSoon = 0;
    let expired = 0;
    let revenue = 0;
    for (const p of premiumProducts) {
      const days = daysUntil(p.premiumExpiresAt);
      if (days === null) {
        active += 1;
      } else if (days < 0) {
        expired += 1;
      } else if (days <= EXPIRING_SOON_DAYS) {
        expiringSoon += 1;
        active += 1;
      } else {
        active += 1;
      }
      revenue += tierAmount(days);
    }
    return { total: premiumProducts.length, active, expiringSoon, expired, revenue };
  }, [premiumProducts]);

  const filtered = useMemo(() => {
    return premiumProducts.filter((p) => {
      if (searchTerm && !p.title.toLowerCase().includes(searchTerm)) return false;
      if (durationFilter !== "all") {
        const days = daysUntil(p.premiumExpiresAt);
        if (days === null || days < 0 || days > Number(durationFilter)) return false;
      }
      return true;
    });
  }, [premiumProducts, searchTerm, durationFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (pageNumber - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, pageNumber]);

  // ── Dialog openers ───────────────────────────────────────────────────────

  const openExtend = (product: ProductResponse) => {
    setSelected(product);
    setPremiumDuration(30);
    setDialog("extend");
    setOpenMenuId(null);
  };

  const openRemovePremium = (product: ProductResponse) => {
    setSelected(product);
    setDialog("removePremium");
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
      await loadProducts();
      showBanner({ kind: "success", message: successMessage });
    } catch (err) {
      showBanner({ kind: "error", message: getErrorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExtend = () => {
    if (!selected) return;
    runMutation(
      () => setAdminProductPremium(selected.id, premiumDuration),
      "Premium duration updated"
    );
  };

  const handleRemovePremium = () => {
    if (!selected) return;
    runMutation(() => removeAdminProductPremium(selected.id), "Premium status removed");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Payments</h1>
            <p className="text-gray-600 text-base md:text-lg">
              Premium product promotions purchased through the platform
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
          <StatCard
            label="Total Revenue"
            value={formatPiasters(stats.revenue)}
            hint="From active promotions"
            icon={<DollarSign className="w-5 h-5 text-[#3d2e7c]" />}
          />
          <StatCard
            label="Total Premium"
            value={stats.total.toLocaleString()}
            hint="Promoted products"
            icon={<Crown className="w-5 h-5 text-yellow-600" />}
          />
          <StatCard
            label="Active"
            value={stats.active.toLocaleString()}
            hint="Currently promoted"
            icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
          />
          <StatCard
            label="Expiring Soon"
            value={stats.expiringSoon.toLocaleString()}
            hint={`Within ${EXPIRING_SOON_DAYS} days`}
            icon={<Clock className="w-5 h-5 text-yellow-600" />}
          />
          <StatCard
            label="Expired"
            value={stats.expired.toLocaleString()}
            hint="Past expiry date"
            icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          />
        </div>

        {/* Filters */}
        <div className="p-4 md:p-6 bg-white border border-gray-100 rounded-xl shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search premium products by title..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-12 h-12 bg-gray-50 border-gray-200"
              />
            </div>

            <select
              value={durationFilter}
              onChange={(e) => {
                setDurationFilter(e.target.value);
                setPageNumber(1);
              }}
              className="w-full md:w-[200px] h-12 px-3 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none focus:border-[#3d2e7c]"
            >
              {DURATION_FILTERS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="p-16 text-center bg-white border border-gray-100 rounded-xl">
            <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading premium products…</p>
          </div>
        ) : loadError ? (
          <div className="p-16 text-center bg-white border border-red-200 rounded-xl">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600">{loadError}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center bg-white border border-gray-100 rounded-xl">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No premium products found</p>
            <p className="text-gray-400 text-sm">Products promoted to premium will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pageItems.map((product) => (
              <PremiumCard
                key={product.id}
                product={product}
                isMenuOpen={openMenuId === product.id}
                onToggleMenu={() =>
                  setOpenMenuId((prev) => (prev === product.id ? null : product.id))
                }
                onCloseMenu={() => setOpenMenuId(null)}
                onView={() => navigate(`/product/${product.id}`)}
                onExtend={() => openExtend(product)}
                onRemovePremium={() => openRemovePremium(product)}
                onSellerClick={() => navigate(`/profile/${product.ownerUserId}`)}
              />
            ))}
          </div>
        )}

        {!isLoading && !loadError && filtered.length > 0 && (
          <Pagination
            currentPage={pageNumber}
            totalPages={totalPages}
            onPageChange={setPageNumber}
          />
        )}
      </div>

      {/* Extend / update premium dialog */}
      <Modal
        open={dialog === "extend"}
        onClose={closeDialog}
        title="Update Premium Duration"
        description={selected ? `Set how long "${selected.title}" stays premium from now.` : ""}
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
          <PrimaryButton onClick={handleExtend} disabled={isSubmitting} loading={isSubmitting}>
            <Crown className="w-4 h-4 mr-2" />
            Update
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
    </div>
  );
}

// ─── Premium card ────────────────────────────────────────────────────────────

interface PremiumCardProps {
  product: ProductResponse;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onView: () => void;
  onExtend: () => void;
  onRemovePremium: () => void;
  onSellerClick: () => void;
}

function PremiumCard({
  product,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onView,
  onExtend,
  onRemovePremium,
  onSellerClick,
}: PremiumCardProps) {
  const days = daysUntil(product.premiumExpiresAt);
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
            <DollarSign className="w-10 h-10 text-gray-300" />
          </div>
        )}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
          <Pill variant="premium">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Pill>
          <Pill variant={expiryPillVariant(days)}>{expiryLabel(days)}</Pill>
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
                  <MenuItem
                    icon={<Crown className="w-4 h-4" />}
                    label="Update Duration"
                    onClick={onExtend}
                  />
                  <div className="my-1 border-t border-gray-100" />
                  <MenuItem
                    icon={<X className="w-4 h-4" />}
                    label="Remove Premium"
                    onClick={onRemovePremium}
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
            Expires {formatDate(product.premiumExpiresAt)}
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
