import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Heart, Package, TrendingUp, Crown } from "lucide-react";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Pagination } from "./ui/Pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  getMyListings,
  deleteProduct,
  getPremiumPrice,
  makePremium,
  type ProductResponse,
  type ProductStatus,
  type SellerSummaryResponse,
} from "../services/productService";

const PAGE_SIZE = 9;

const PREMIUM_DURATIONS = [7, 30, 90, 180, 365];

type TabValue = "all" | "active" | "sold" | "closed" | "deleted";

const TAB_STATUS: Record<TabValue, ProductStatus | undefined> = {
  all: undefined,
  active: "Active",
  sold: "Sold",
  closed: "Closed",
  deleted: "Deleted",
};

function formatPrice(p: ProductResponse): string {
  if (p.type === "Wanted") {
    if (p.minPrice != null && p.maxPrice != null) return `$${p.minPrice} - $${p.maxPrice}`;
    if (p.maxPrice != null) return `Up to $${p.maxPrice}`;
    return "Wanted";
  }
  if (p.type === "Swap") return "Swap";
  return p.price != null ? `$${p.price}` : "—";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDuration(days: number): string {
  if (days === 7) return "1 Week";
  if (days === 30) return "1 Month";
  if (days === 90) return "3 Months";
  if (days === 180) return "6 Months";
  if (days === 365) return "1 Year";
  return `${days} Days`;
}

function getStatusBadge(status: ProductStatus) {
  switch (status) {
    case "Active":
      return <Badge className="bg-green-500">Active</Badge>;
    case "Sold":
      return <Badge className="bg-blue-500">Sold</Badge>;
    case "Closed":
      return <Badge className="bg-gray-500">Closed</Badge>;
    case "UnderReview":
      return <Badge className="bg-yellow-500">Under Review</Badge>;
    case "Deleted":
      return <Badge className="bg-red-500">Deleted</Badge>;
  }
}

function PromoteDialog({
  product,
  onError,
}: {
  product: ProductResponse;
  onError: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getPremiumPrice(durationDays)
      .then((quote) => {
        // Backend amounts are in piasters (Paymob cents convention)
        if (!cancelled) setPrice(`${quote.amount / 100} ${quote.currency}`);
      })
      .catch(() => {
        if (!cancelled) setPrice(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, durationDays]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setPrice(null);
  };

  const handleDurationChange = (value: string) => {
    setDurationDays(Number(value));
    setPrice(null);
  };

  const handlePromote = async () => {
    setSubmitting(true);
    try {
      const { paymentUrl } = await makePremium(product.id, durationDays);
      window.location.href = paymentUrl;
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to start promotion payment");
      setSubmitting(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 border-[#4B0082] text-[#4B0082] hover:bg-[#4B0082] hover:text-white text-xs sm:text-sm"
        >
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          Promote
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Promote "{product.title}"</AlertDialogTitle>
          <AlertDialogDescription>
            Premium products get a Premium badge and rank higher in recommendations. Choose a
            duration and you will be redirected to complete the payment.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center gap-4 py-2">
          <Select value={String(durationDays)} onValueChange={handleDurationChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PREMIUM_DURATIONS.map((days) => (
                <SelectItem key={days} value={String(days)}>
                  {formatDuration(days)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">
            {price ? (
              <>
                Price: <span className="font-semibold text-gray-900">{price}</span>
              </>
            ) : (
              "Loading price..."
            )}
          </span>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handlePromote();
            }}
            disabled={submitting}
            className="bg-gradient-to-r from-[#4B0082] to-[#3d2e7c] hover:opacity-90"
          >
            {submitting ? "Redirecting..." : "Continue to Payment"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ProductCard({
  product,
  deleting,
  onDelete,
  onError,
}: {
  product: ProductResponse;
  deleting: boolean;
  onDelete: (id: string) => void;
  onError: (message: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative">
        <div className="w-full h-40 sm:h-48 bg-gray-100">
          <img
            src={product.coverImageUrl}
            alt={product.title}
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => navigate(`/product/${product.id}`)}
          />
        </div>
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex gap-1.5">
          {getStatusBadge(product.status)}
          {product.isPremium && (
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
        {product.type !== "Regular" && (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-[#7C3AED] text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full uppercase">
            {product.type}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <h3
          className="font-semibold text-[15px] sm:text-[17px] text-gray-900 mb-2 cursor-pointer hover:text-[#4B0082] transition-colors line-clamp-2"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          {product.title}
        </h3>

        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <span className="text-[20px] sm:text-[24px] font-bold text-[#4B0082]">
            {formatPrice(product)}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{product.favoritesCount}</span>
          </div>
          <div className="ml-auto text-gray-500 text-[10px] sm:text-xs">
            {formatDate(product.createdAt)}
          </div>
        </div>

        {(product.status === "Active" || product.status === "Closed") && (
          <div className="flex gap-2">
            {product.status === "Active" && !product.isPremium && (
              <PromoteDialog product={product} onError={onError} />
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={deleting}
                  className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this product?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your product listing.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(product.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}

export function MyProductsPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [summary, setSummary] = useState<SellerSummaryResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadListings = useCallback(async (tab: TabValue, page: number) => {
    setLoading(true);
    try {
      const result = await getMyListings({
        pageNumber: page,
        pageSize: PAGE_SIZE,
        status: TAB_STATUS[tab],
        sortBy: "Newest",
        sortDirection: "Desc",
      });
      setProducts(result.products);
      setSummary(result.summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings(activeTab, currentPage);
  }, [activeTab, currentPage, loadListings]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteProduct(id);
      await loadListings(activeTab, currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    } finally {
      setDeletingId(null);
    }
  };

  // Backend response carries no paging metadata; a full page implies more may follow.
  const hasNext = products.length === PAGE_SIZE;
  const totalPages = hasNext ? currentPage + 1 : currentPage;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-[28px] sm:text-[32px] lg:text-[36px] font-bold text-gray-900 mb-1 sm:mb-2">
                My Products
              </h1>
              <p className="text-gray-600 text-[14px] sm:text-[16px]">
                Manage your listings and track performance
              </p>
            </div>
            <Button
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-[#4B0082] to-[#3d2e7c] hover:opacity-90 text-sm sm:text-base"
              onClick={() => navigate("/create-product")}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              List New Item
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
              <p className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">Total Listings</p>
              <p className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-gray-900">
                {summary?.totalProducts ?? "—"}
              </p>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
              <p className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">Active</p>
              <p className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-green-600">
                {summary?.activeCount ?? "—"}
              </p>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
              <p className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">Sold</p>
              <p className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-blue-600">
                {summary?.soldCount ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="all">All{summary ? ` (${summary.totalProducts})` : ""}</TabsTrigger>
            <TabsTrigger value="active">
              Active{summary ? ` (${summary.activeCount})` : ""}
            </TabsTrigger>
            <TabsTrigger value="sold">Sold{summary ? ` (${summary.soldCount})` : ""}</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
            <TabsTrigger value="deleted">Deleted</TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">Loading your listings...</p>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    deleting={deletingId === product.id}
                    onDelete={handleDelete}
                    onError={setError}
                  />
                ))}
              </div>
              {(currentPage > 1 || hasNext) && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">
                {activeTab === "all" ? "No listings yet" : `No ${activeTab} listings`}
              </p>
              {(activeTab === "all" || activeTab === "active") && (
                <Button onClick={() => navigate("/create-product")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Listing
                </Button>
              )}
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
}
