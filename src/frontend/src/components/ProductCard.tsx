import { Heart, MapPin, ShieldCheck, Package, ArrowRightLeft, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  type: "Regular" | "Wanted" | "Swap";
  condition: "New" | "Like New" | "Used" | "Broken";
  seller: {
    username: string;
    verified: boolean;
  };
  location: string;
  hasAppShipping?: boolean;
  isFavorited?: boolean;
  swapFor?: string; // What they want in exchange (for Swap type)
  desiredPriceRange?: string; // For Wanted type
}

export function ProductCard({
  id,
  title,
  description,
  price,
  image,
  type,
  condition,
  seller,
  location,
  hasAppShipping = false,
  isFavorited = false,
  swapFor,
  desiredPriceRange,
}: ProductCardProps) {
  const navigate = useNavigate();
  const [favorited, setFavorited] = useState(isFavorited);

  const getTypeBadgeColor = () => {
    switch (type) {
      case "Wanted":
        return "bg-gradient-to-r from-blue-500 to-blue-600";
      case "Swap":
        return "bg-gradient-to-r from-green-500 to-green-600";
      default:
        return "bg-gradient-to-r from-[#4B0082] to-[#3d2e7c]";
    }
  };

  const getConditionBadgeColor = () => {
    switch (condition) {
      case "New":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Like New":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Used":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Broken":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case "Wanted":
        return <Search className="w-3.5 h-3.5" />;
      case "Swap":
        return <ArrowRightLeft className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  // Guard against undefined values
  if (!type || !condition) {
    return null;
  }

  return (
    <div
      className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
      onClick={() => navigate(`/product/${id}`)}
    >
      {/* Image Container */}
      <div className="relative h-48 sm:h-56 md:h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Type Badge - Top Left */}
        <div
          className={`absolute top-2 sm:top-3 left-2 sm:left-3 ${getTypeBadgeColor()} text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-lg flex items-center gap-1 sm:gap-1.5`}
        >
          {getTypeIcon()}
          <span>{type.toUpperCase()}</span>
        </div>

        {/* Condition Badge - Top Right */}
        <div
          className={`absolute top-2 sm:top-3 right-2 sm:right-3 ${getConditionBadgeColor()} text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border backdrop-blur-sm z-10`}
        >
          {condition}
        </div>

        {/* Favorite Button - Bottom Right (always visible, better placement) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFavorited(!favorited);
          }}
          className={`absolute bottom-2 sm:bottom-3 right-2 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full ${
            favorited ? "bg-red-500 text-white" : "bg-white/95 text-gray-600 backdrop-blur-sm"
          } flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 z-10`}
        >
          <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${favorited ? "fill-current" : ""}`} />
        </button>

        {/* Shipping Badge - Bottom Left */}
        {hasAppShipping && (
          <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-gradient-to-r from-[#4B0082] to-[#3d2e7c] text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg flex items-center gap-1 sm:gap-1.5 shadow-lg backdrop-blur-sm">
            <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden xs:inline">Shippable</span>
            <span className="xs:hidden">Ship</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3 sm:p-4 md:p-5">
        {/* Title */}
        <h3 className="font-semibold text-[14px] sm:text-[15px] md:text-[16px] text-gray-900 mb-1 sm:mb-2 line-clamp-1 group-hover:text-[#4B0082] transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-500 text-[12px] sm:text-[13px] mb-2 sm:mb-3 line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Swap/Wanted Info */}
        {type === "Swap" && swapFor && (
          <div className="mb-2 sm:mb-3 p-2 sm:p-2.5 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-[10px] sm:text-xs font-semibold text-green-700 mb-0.5">
              Looking to swap for:
            </p>
            <p className="text-[10px] sm:text-xs text-green-600">{swapFor}</p>
          </div>
        )}

        {type === "Wanted" && desiredPriceRange && (
          <div className="mb-2 sm:mb-3 p-2 sm:p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-[10px] sm:text-xs font-semibold text-blue-700 mb-0.5">
              Desired price range:
            </p>
            <p className="text-[10px] sm:text-xs text-blue-600">{desiredPriceRange}</p>
          </div>
        )}

        {/* Seller Info */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
            <span className="text-white text-[9px] sm:text-[10px] font-semibold">
              {seller.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <span className="text-[11px] sm:text-xs text-gray-700 font-medium">
              {seller.username}
            </span>
            {seller.verified && <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" />}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 sm:gap-1.5 mb-3 sm:mb-4 text-gray-500">
          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="text-[11px] sm:text-xs">{location}</span>
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100">
          {/* Only show price for Regular items */}
          {type === "Regular" ? (
            <>
              <span className="text-[18px] sm:text-[20px] md:text-[22px] font-bold text-[#4B0082]">
                ${price}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/product/${id}`);
                }}
                className="bg-gradient-to-r from-[#4B0082] to-[#3d2e7c] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[12px] sm:text-[13px] font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                View
              </button>
            </>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/product/${id}`);
              }}
              className="w-full bg-gradient-to-r from-[#4B0082] to-[#3d2e7c] text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-[12px] sm:text-[13px] font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              {type === "Wanted" ? "View Request" : "View Swap"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
