import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Check,
  ChevronLeft,
  Copy,
  Mail,
  MapPin,
  Package,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { getMyProfile, getPublicProfile } from "../services/userService";
import type { UserProfileResponse } from "../services/userService";
import { getProductsByUser } from "../services/productService";
import type { ProductResponse } from "../services/productService";
import { followUser, unfollowUser, getFollowing } from "../services/followService";
import { AuthError } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { Pagination } from "./ui/Pagination";

const PRODUCTS_PAGE_SIZE = 9;

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

function formatLocation(p: UserProfileResponse): string[] {
  const lines: string[] = [];
  if (p.addressLine1) lines.push(p.addressLine1);
  const cityStateZip = [p.city, p.stateProvince, p.postalCode].filter(Boolean).join(", ");
  if (cityStateZip) lines.push(cityStateZip);
  if (p.country) lines.push(p.country);
  return lines;
}

function shortId(id: string): string {
  return id.split("-")[0] ?? id.slice(0, 8);
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

export function PublicUserProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user: viewer, isLoading: viewerLoading } = useAuth();

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Products
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productsTotalPages, setProductsTotalPages] = useState(1);
  const [productsPage, setProductsPage] = useState(1);

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followKnown, setFollowKnown] = useState(false);
  const [isFollowBusy, setIsFollowBusy] = useState(false);

  const [banner, setBanner] = useState<{ kind: "success" | "error"; msg: string } | null>(null);
  const [idCopied, setIdCopied] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const isSelf = useMemo(() => {
    if (!viewerId || !profile) return false;
    return viewerId === profile.id;
  }, [viewerId, profile]);

  // Load profile
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getPublicProfile(userId)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          const msg =
            err instanceof AuthError && err.status === 404
              ? "User not found."
              : err.message || "Failed to load profile.";
          setLoadError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Resolve the authenticated viewer's id (used for self-detection)
  useEffect(() => {
    setViewerId(null);
    if (viewerLoading || !viewer) return;
    let cancelled = false;
    getMyProfile()
      .then((me) => {
        if (!cancelled) setViewerId(me.id);
      })
      .catch(() => {
        // ignore — treat as not-self
      });
    return () => {
      cancelled = true;
    };
  }, [viewer, viewerLoading]);

  // Load this user's active products (paged)
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setProductsLoading(true);
    setProductsError(null);

    getProductsByUser(userId, {
      pageNumber: productsPage,
      pageSize: PRODUCTS_PAGE_SIZE,
      sortBy: "Newest",
      sortDirection: "Desc",
    })
      .then((page) => {
        if (cancelled) return;
        setProducts(page.data);
        setProductsTotal(page.totalRecords);
        setProductsTotalPages(page.totalPages);
      })
      .catch((err: Error) => {
        if (!cancelled) setProductsError(err.message || "Failed to load listings.");
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, productsPage]);

  // Detect follow state for authenticated viewers (non-self)
  useEffect(() => {
    setFollowKnown(false);
    setIsFollowing(false);
    if (!userId || viewerLoading) return;
    if (!viewer) return; // anonymous
    if (viewerId && viewerId === userId) return; // self

    let cancelled = false;

    const probe = async (pageNumber: number): Promise<void> => {
      const page = await getFollowing({ pageNumber, pageSize: 50 });
      if (cancelled) return;
      const hit = page.data.some((f) => f.id === userId);
      if (hit) {
        setIsFollowing(true);
        setFollowKnown(true);
        return;
      }
      if (pageNumber < page.totalPages) {
        await probe(pageNumber + 1);
      } else if (!cancelled) {
        setIsFollowing(false);
        setFollowKnown(true);
      }
    };

    probe(1).catch(() => {
      if (!cancelled) setFollowKnown(true); // unknown, treat as not-following
    });

    return () => {
      cancelled = true;
    };
  }, [userId, viewer, viewerLoading, viewerId]);

  // Auto-dismiss banner
  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(timer);
  }, [banner]);

  const handleFollow = async () => {
    if (!userId || !profile) return;
    if (!viewer) {
      navigate("/login");
      return;
    }
    setIsFollowBusy(true);
    setBanner(null);
    try {
      await followUser(userId);
      setIsFollowing(true);
      setFollowKnown(true);
      setProfile((prev) => (prev ? { ...prev, followersCount: prev.followersCount + 1 } : prev));
      setBanner({ kind: "success", msg: `You are now following ${profile.fullName}.` });
    } catch (err) {
      if (err instanceof AuthError && err.status === 409) {
        // already following — sync state
        setIsFollowing(true);
        setFollowKnown(true);
      } else {
        const msg = err instanceof Error ? err.message : "Could not follow user.";
        setBanner({ kind: "error", msg });
      }
    } finally {
      setIsFollowBusy(false);
    }
  };

  const handleUnfollow = async () => {
    if (!userId || !profile) return;
    setIsFollowBusy(true);
    setBanner(null);
    try {
      await unfollowUser(userId);
      setIsFollowing(false);
      setFollowKnown(true);
      setProfile((prev) =>
        prev ? { ...prev, followersCount: Math.max(0, prev.followersCount - 1) } : prev
      );
      setBanner({ kind: "success", msg: `You unfollowed ${profile.fullName}.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not unfollow user.";
      setBanner({ kind: "error", msg });
    } finally {
      setIsFollowBusy(false);
    }
  };

  if (isLoading || viewerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{loadError ?? "Profile not available."}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const initials = getInitials(profile.fullName);
  const locationLines = formatLocation(profile);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-[#7C3AED] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div
            className={`rounded-lg px-4 py-3 text-sm font-medium ${
              banner.kind === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {banner.msg}
          </div>
        </div>
      )}

      {/* Profile card */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Cover + avatar */}
          <div className="relative">
            <div
              className={`h-40 sm:h-48 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] overflow-hidden ${profile.coverImageUrl ? "cursor-pointer" : ""}`}
              onClick={() => profile.coverImageUrl && setLightboxSrc(profile.coverImageUrl)}
            >
              {profile.coverImageUrl && (
                <img
                  src={profile.coverImageUrl}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="absolute -bottom-16 left-6 sm:left-8">
              <div
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-2xl border-4 border-white overflow-hidden ${profile.profileImageUrl ? "cursor-pointer" : ""}`}
                onClick={() => profile.profileImageUrl && setLightboxSrc(profile.profileImageUrl)}
              >
                {profile.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt={profile.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
            </div>

            {/* Action button */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-6">
              {isSelf ? (
                <button
                  type="button"
                  onClick={() => navigate("/my-profile")}
                  className="bg-white text-[#7C3AED] hover:bg-gray-50 font-semibold px-5 py-2 rounded-full shadow-lg transition-colors text-sm"
                >
                  Edit Profile
                </button>
              ) : !viewer ? (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="bg-white text-[#7C3AED] hover:bg-gray-50 font-semibold px-5 py-2 rounded-full shadow-lg transition-colors text-sm"
                >
                  Sign in to follow
                </button>
              ) : isFollowing ? (
                <button
                  type="button"
                  onClick={handleUnfollow}
                  disabled={isFollowBusy || !followKnown}
                  className="flex items-center gap-1.5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-semibold px-4 py-2 rounded-full shadow transition-colors text-sm disabled:opacity-60"
                >
                  <UserMinus className="w-4 h-4" />
                  {isFollowBusy ? "Unfollowing…" : "Unfollow"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFollow}
                  disabled={isFollowBusy || !followKnown}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white font-semibold px-5 py-2 rounded-full shadow hover:shadow-lg text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <UserPlus className="w-4 h-4" />
                  {isFollowBusy ? "Following…" : "Follow"}
                </button>
              )}
            </div>
          </div>

          {/* Profile body */}
          <div className="pt-20 px-6 sm:px-8 pb-8">
            <div className="mb-6">
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{profile.fullName}</h1>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(profile.id).then(() => {
                      setIdCopied(true);
                      setTimeout(() => setIdCopied(false), 2000);
                    });
                  }}
                  className="flex items-center gap-1 text-xs font-mono text-gray-500 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                  title="Copy full ID"
                >
                  #{shortId(profile.id)}
                  {idCopied ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              {profile.email && (
                <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Bio</h3>
                  <p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">
                    {profile.bio?.trim() ? profile.bio : "—"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Location</h3>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    {locationLines.length === 0 ? (
                      <p className="text-gray-500 text-base">No location set.</p>
                    ) : (
                      <div className="text-gray-900 text-base">
                        {locationLines.map((line, idx) => (
                          <p key={idx}>{line}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <h3 className="font-semibold text-gray-900 mb-4">Profile Stats</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-[#7C3AED]">{profile.followersCount}</p>
                      <p className="text-sm text-gray-600">Followers</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#7C3AED]">{profile.followingCount}</p>
                      <p className="text-sm text-gray-600">Following</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#7C3AED]">{productsTotal}</p>
                      <p className="text-sm text-gray-600">Products</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Listings */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {isSelf ? "Your active listings" : `Listings by ${profile.fullName}`}
            </h2>
            {productsTotal > 0 && (
              <span className="text-sm text-gray-500">
                {productsTotal.toLocaleString()} item{productsTotal === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {productsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : productsError ? (
            <div className="text-center py-12">
              <p className="text-red-500">{productsError}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">This user has no active listings yet.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {products.map((p) => (
                  <ProductTile
                    key={p.id}
                    product={p}
                    onClick={() => navigate(`/product/${p.id}`)}
                  />
                ))}
              </div>
              <Pagination
                currentPage={productsPage}
                totalPages={productsTotalPages}
                onPageChange={(page) => {
                  setProductsPage(page);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          )}
        </div>
      </div>

      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setLightboxSrc(null)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxSrc(null)}
              className="absolute top-2 right-2 text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxSrc}
              alt="Preview"
              className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain block"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ProductTile({ product, onClick }: { product: ProductResponse; onClick: () => void }) {
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
        <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
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
        <p className="text-lg font-bold text-[#7C3AED]">{formatPrice(product)}</p>
      </div>
    </div>
  );
}
