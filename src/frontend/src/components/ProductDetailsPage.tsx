import { useEffect, useState } from "react";
import {
  Heart,
  Check,
  Share2,
  MapPin,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  ShieldCheck,
  Star,
  Flag,
  Pencil,
} from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useNavigate, useParams } from "react-router-dom";
import { getProductDetails } from "../services/productService";
import type { ProductDetailsResponse } from "../services/productService";
import {
  getProductComments,
  addProductComment,
  getCommentReplies,
} from "../services/commentService";
import type { CommentResponse } from "../services/commentService";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { trackActivity } from "../services/activityService";
import { ReportDialog } from "./ReportDialog";

function formatPrice(p: ProductDetailsResponse): string {
  if (p.type === "Wanted") {
    if (p.desiredPriceMin != null && p.desiredPriceMax != null)
      return `$${p.desiredPriceMin} - $${p.desiredPriceMax}`;
    if (p.desiredPriceMax != null) return `Up to $${p.desiredPriceMax}`;
    return "Wanted";
  }
  if (p.type === "Swap") return "Swap";
  return p.price != null ? `$${p.price}` : "—";
}

function formatLocation(p: ProductDetailsResponse): string {
  const parts = [p.locationCity, p.locationCountry].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

function formatDate(value: string): string {
  const date = new Date(value);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return `Today, ${date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProductDetailsPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { isFavorited, add, remove } = useFavorites();

  const [product, setProduct] = useState<ProductDetailsResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [repliesMap, setRepliesMap] = useState<Record<string, CommentResponse[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comment, setComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const [reportDialog, setReportDialog] = useState<{
    targetType: "Product" | "Comment";
    targetId: string;
  } | null>(null);

  const loadReplies = async (commentId: string) => {
    if (repliesMap[commentId] || !productId) return;

    setLoadingReplies((prev) => new Set(prev).add(commentId));
    try {
      const result = await getCommentReplies(productId, commentId, {
        pageNumber: 1,
        pageSize: 20,
        sortDirection: "Asc",
      });

      setRepliesMap((prev) => ({ ...prev, [commentId]: result.data }));
      setExpandedReplies((prev) => new Set(prev).add(commentId));
    } finally {
      setLoadingReplies((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  const toggleReplies = async (commentId: string) => {
    if (expandedReplies.has(commentId)) {
      setExpandedReplies((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
      return;
    }

    if (repliesMap[commentId]) {
      setExpandedReplies((prev) => new Set(prev).add(commentId));
      return;
    }

    await loadReplies(commentId);
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    const body = replyText.trim();
    if (!body || !productId) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setReplyError(null);
    try {
      const created = await addProductComment(productId, { body, parentCommentId });
      setRepliesMap((prev) => ({
        ...prev,
        [parentCommentId]: [...(prev[parentCommentId] ?? []), created],
      }));
      // bump the replyCount on the parent so the counter stays accurate
      setComments((prev) =>
        prev.map((c) => (c.id === parentCommentId ? { ...c, replyCount: c.replyCount + 1 } : c))
      );
      setExpandedReplies((prev) => new Set(prev).add(parentCommentId));
      setReplyingTo(null);
      setReplyText("");
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : "Failed to post reply.");
    }
  };

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      const p = await getProductDetails(productId);
      if (cancelled) return;
      setProduct(p);
      setCurrentImageIndex(0);

      if (isAuthenticated) {
        trackActivity({
          productId: p.id,
          type: "product.viewed",
          description: `Viewed product: ${p.title}`,
        }).catch(() => {});
      }

      const commentsResult = await getProductComments(productId, {
        pageNumber: 1,
        pageSize: 50,
        sortDirection: "Asc",
      }).catch(() => null);
      if (cancelled) return;
      if (commentsResult) setComments(commentsResult.data);
    };

    load()
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load product.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">{error || "Product not found."}</p>
        <Button onClick={() => navigate("/products")}>Back to Products</Button>
      </div>
    );
  }

  const images = product.images;
  const categoryName = product.categoryName || "—";
  const conditionLabel = product.condition;
  const favorited = isFavorited(product.id);

  const nextImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      if (favorited) {
        await remove(product.id);
      } else {
        await add(product.id);
      }
    } catch {
      // context already reverted optimistic state
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // clipboard unavailable (e.g. insecure context); silently ignore
    }
  };

  const handleSubmitComment = async () => {
    const body = comment.trim();
    if (!body || !productId) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setPostingComment(true);
    setCommentError(null);
    try {
      const created = await addProductComment(productId, { body });
      setComments((prev) => [...prev, created]);
      setComment("");
    } catch (err) {
      // keep the typed comment so the user can retry
      setCommentError(err instanceof Error ? err.message : "Failed to post comment.");
    } finally {
      setPostingComment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <button onClick={() => navigate("/")} className="hover:text-[#4B0082]">
              Home
            </button>
            <span>/</span>
            <button onClick={() => navigate("/products")} className="hover:text-[#4B0082]">
              Products
            </button>
            <span>/</span>
            <span className="text-gray-900">{categoryName}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 aspect-square">
              {images.length > 0 ? (
                <img
                  src={images[currentImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}

              {images.length > 1 && (
                <>
                  {/* Navigation Arrows */}
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-900" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-900" />
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 bg-gradient-to-r from-[#A855F7] to-[#9333EA] text-white text-xs font-bold px-4 py-2 rounded-full">
                {product.type.toUpperCase()}
              </div>
              {conditionLabel && (
                <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-full">
                  {conditionLabel.toUpperCase()}
                </div>
              )}
              {product.isPremium && (
                <div className="absolute bottom-4 left-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold px-4 py-2 rounded-full">
                  ⭐ PREMIUM
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
              <h2 className="text-[20px] font-bold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Product Details */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
              <h3 className="text-[18px] font-semibold text-gray-900 mb-4">Product Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {conditionLabel && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Condition</p>
                    <p className="font-semibold text-gray-900">{conditionLabel}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Category</p>
                  <p className="font-semibold text-gray-900">{categoryName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Location</p>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <p className="font-semibold text-gray-900">{formatLocation(product)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Listed</p>
                  <p className="font-semibold text-gray-900">{formatDate(product.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div>
            {/* Title & Actions */}
            <div className="mb-6">
              <h1 className="text-[36px] font-bold text-gray-900 mb-4">{product.title}</h1>
              <div className="flex items-center gap-3">
                {user?.id === product.ownerUserId && (
                  <button
                    onClick={() => navigate(`/product/${product.id}/edit`)}
                    className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[#4B0082] text-[#4B0082] hover:bg-purple-50 transition-all duration-200"
                  >
                    <Pencil className="w-5 h-5" />
                    <span className="font-medium">Edit</span>
                  </button>
                )}
                <button
                  onClick={toggleFavorite}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full border-2 transition-all duration-200 ${
                    favorited
                      ? "bg-red-50 border-red-500 text-red-600"
                      : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${favorited ? "fill-current" : ""}`} />
                  <span className="font-medium">{favorited ? "Saved" : "Save"}</span>
                </button>
                <button
                  onClick={handleShare}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full border-2 transition-all duration-200 ${shareCopied ? "border-green-500 text-green-600 bg-green-50" : "border-gray-300 text-gray-700 hover:border-gray-400"}`}
                >
                  {shareCopied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                  <span className="font-medium">{shareCopied ? "Copied!" : "Share"}</span>
                </button>
                {isAuthenticated && product && (
                  <button
                    onClick={() => setReportDialog({ targetType: "Product", targetId: product.id })}
                    className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 hover:border-red-400 hover:text-red-500 transition-all duration-200"
                  >
                    <Flag className="w-5 h-5" />
                    <span className="font-medium">Report</span>
                  </button>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-[#4B0082] to-[#3d2e7c] rounded-2xl p-8 mb-6">
              <div className="flex items-end gap-3 mb-4">
                <span className="text-[48px] font-bold text-white">{formatPrice(product)}</span>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  size="lg"
                  className="w-full bg-white text-[#4B0082] hover:bg-gray-100 text-[16px] font-semibold py-6 rounded-xl"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Contact Seller
                </Button>
                {product.allowNegotiation && (
                  <Button
                    size="lg"
                    className="w-full border-2 border-white text-white bg-transparent hover:bg-white/10 hover:text-white text-[16px] font-semibold py-6 rounded-xl"
                  >
                    Make an Offer
                  </Button>
                )}
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="text-[18px] font-semibold text-gray-900 mb-4">Seller Information</h3>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-[20px] font-bold overflow-hidden">
                  {product.ownerProfileImageUrl ? (
                    <img
                      src={product.ownerProfileImageUrl}
                      alt={product.ownerUserName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    product.ownerUserName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[18px] font-semibold text-gray-900">
                      {product.ownerUserName}
                    </span>
                    <ShieldCheck
                      className={`w-6 h-6 ${product.ownerIsVerified ? "text-green-500" : "text-gray-400"}`}
                    >
                      <title>{product.ownerIsVerified ? "Verified" : "Not Verified"}</title>
                    </ShieldCheck>
                  </div>
                  {product.ownerRatingsCount > 0 && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-semibold text-gray-900">
                        {product.ownerRatingsAverage.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-600">
                        ({product.ownerRatingsCount}{" "}
                        {product.ownerRatingsCount === 1 ? "review" : "reviews"})
                      </span>
                    </div>
                  )}
                  {product.memberSince && (
                    <p className="text-sm text-gray-600">Member since {product.memberSince}</p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => navigate(`/profile/${product.ownerUserId}`)}
              >
                View Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200">
          <h2 className="text-[24px] font-bold text-gray-900 mb-6">Comments</h2>

          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-gray-500">No comments yet. Be the first to ask a question.</p>
          ) : (
            <div className="space-y-6">
              {comments.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 pb-6 border-b border-gray-200 last:border-0"
                >
                  <button
                    onClick={() => navigate(`/profile/${item.author.id}`)}
                    className="flex-shrink-0 cursor-pointer self-start block leading-none p-0"
                  >
                    {item.author.profileImageUrl ? (
                      <img
                        src={item.author.profileImageUrl}
                        alt={item.author.fullName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                        {item.author.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => navigate(`/profile/${item.author.id}`)}
                        className="font-semibold text-gray-900 hover:underline  cursor-pointer"
                      >
                        {item.author.fullName}
                      </button>
                      <span className="text-sm text-gray-500">{formatDate(item.createdAt)}</span>
                      {item.isEdited && <span className="text-xs text-gray-400">(edited)</span>}
                    </div>
                    <p className="text-gray-700 mb-2">{item.body}</p>

                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => setReplyingTo(replyingTo === item.id ? null : item.id)}
                        className="text-sm text-[#4B0082] hover:underline"
                      >
                        Reply
                      </button>
                      {item.replyCount > 0 && (
                        <button
                          onClick={() => void toggleReplies(item.id)}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          {loadingReplies.has(item.id)
                            ? "Loading..."
                            : expandedReplies.has(item.id)
                              ? "Hide replies"
                              : `View ${item.replyCount} ${item.replyCount === 1 ? "reply" : "replies"}`}
                        </button>
                      )}
                      {isAuthenticated && (
                        <button
                          onClick={() =>
                            setReportDialog({ targetType: "Comment", targetId: item.id })
                          }
                          className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                        >
                          <Flag className="w-3 h-3" />
                          Report
                        </button>
                      )}
                    </div>

                    {expandedReplies.has(item.id) &&
                      repliesMap[item.id]?.map((reply) => (
                        <div
                          key={reply.id}
                          className="mt-3 ml-4 border-l-2 border-purple-100 pl-4 flex gap-3"
                        >
                          <button
                            onClick={() => navigate(`/profile/${reply.author.id}`)}
                            className="flex-shrink-0 cursor-pointer"
                          >
                            {reply.author.profileImageUrl ? (
                              <img
                                src={reply.author.profileImageUrl}
                                alt={reply.author.fullName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                                {reply.author.fullName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </button>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <button
                                onClick={() => navigate(`/profile/${reply.author.id}`)}
                                className="font-semibold text-sm text-gray-900 hover:underline cursor-pointer"
                              >
                                {reply.author.fullName}
                              </button>
                              <span className="text-xs text-gray-400">
                                {formatDate(reply.createdAt)}
                              </span>
                              {reply.isEdited && (
                                <span className="text-xs text-gray-400">(edited)</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">{reply.body}</p>
                            {isAuthenticated && (
                              <button
                                onClick={() =>
                                  setReportDialog({ targetType: "Comment", targetId: reply.id })
                                }
                                className="mt-1 text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                              >
                                <Flag className="w-3 h-3" />
                                Report
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                    {replyingTo === item.id && (
                      <div className="mt-3 ml-4 border-l-2 border-purple-100 pl-4">
                        <Textarea
                          placeholder={`Reply to ${item.author.fullName}...`}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="min-h-[80px] mb-2"
                        />
                        {replyError && <p className="text-sm text-red-600 mb-2">{replyError}</p>}
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText("");
                              setReplyError(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            disabled={!replyText.trim()}
                            onClick={() => handleSubmitReply(item.id)}
                            className="bg-[#4B0082] hover:bg-[#3d2e7c]"
                          >
                            <Send className="w-3 h-3 mr-1" /> Reply
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment Input */}
          {isAuthenticated ? (
            <div className="mt-8">
              <Textarea
                placeholder="Ask a question about this item..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px] mb-3"
              />
              {commentError && <p className="text-sm text-red-600 mb-3">{commentError}</p>}
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!comment.trim() || postingComment}
                  className="bg-[#4B0082] hover:bg-[#3d2e7c]"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {postingComment ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-t p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
              <button onClick={() => navigate("/login")} className="text-[#4B0082] hover:underline">
                Log in
              </button>{" "}
              to ask a question about this item.
            </div>
          )}
        </div>
      </div>
      {reportDialog && (
        <ReportDialog
          open={!!reportDialog}
          onClose={() => setReportDialog(null)}
          targetType={reportDialog.targetType}
          targetId={reportDialog.targetId}
        />
      )}
    </div>
  );
}
