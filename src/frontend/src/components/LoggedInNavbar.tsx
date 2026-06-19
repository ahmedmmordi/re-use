import { useState, useEffect } from "react";
import { useFavorites } from "../context/FavoritesContext";
import {
  Heart,
  Bell,
  MessageCircle,
  User,
  ChevronDown,
  Shield,
  ShoppingCart,
  Menu,
  X,
  History,
} from "lucide-react";
import { SearchBar } from "./SearchBar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRef } from "react";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  type NotificationDto,
} from "../services/notificationService";
import { useChat } from "../context/ChatContext";

interface LoggedInNavbarProps {
  onLogout?: () => void;
}

export function LoggedInNavbar({ onLogout }: LoggedInNavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const { favoriteIds } = useFavorites();
  const { totalUnreadCount } = useChat();
  const favoriteCount = favoriteIds.size;
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUnreadCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isNotifOpen) return;
    function onClickOutside(e: MouseEvent) {
      if ((e.target as HTMLElement).closest("[data-notif]")) return;
      setIsNotifOpen(false);
      setExpandedId(null);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isNotifOpen]);

  const toggleNotif = async () => {
    if (isNotifOpen) {
      setIsNotifOpen(false);
      setExpandedId(null);
      return;
    }
    setIsNotifOpen(true);
    setNotifLoading(true);
    try {
      const result = await getNotifications(1, 15);
      setNotifications(result.data);
    } catch {
      /* ignore */
    } finally {
      setNotifLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      /* ignore */
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);

    if (unreadIds.length === 0) return;

    try {
      await Promise.all(unreadIds.map((id) => markAsRead(id)));
      setNotifications((prev) => prev.map((n) => (n.isRead ? n : { ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  function timeAgo(dateStr: string): string {
    const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }
  // const notificationCount = 0; // TODO: wire up when implemented
  const chatCount = totalUnreadCount;

  const displayName = user?.fullName || user?.email || "User";
  const displayAvatar = (user?.fullName?.[0] ?? user?.email?.[0] ?? "U").toUpperCase();
  const avatarUrl = user?.profileImageUrl ?? null;
  const isAdmin = user?.role === "Admin";

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
  };

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
      navigate("/login");
    }
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] w-full px-4 sm:px-6 md:px-8 py-4 md:py-6">
        <div className="flex items-center justify-between h-full max-w-[1600px] mx-auto gap-2 sm:gap-4 md:gap-8">
          {/* Logo */}
          <h1
            className="text-white text-[24px] sm:text-[28px] md:text-[36px] font-normal italic flex-shrink-0 cursor-pointer"
            style={{ fontFamily: "'Pacifico', cursive" }}
            onClick={() => navigate("/")}
          >
            ReUse
          </h1>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:block flex-1">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Right Section: User Actions - Desktop */}
          <div className="hidden md:flex items-center gap-3 lg:gap-5 flex-shrink-0">
            {/* Favorites */}
            <button
              onClick={() => navigate("/favorites")}
              className="text-white p-2 rounded-lg hover:bg-white/10 hover:scale-105 transition-all duration-200 relative group"
            >
              <Heart className="w-4 h-4 lg:w-5 lg:h-5" />
              {favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FF4B6E] text-white text-[10px] font-bold rounded-full w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center">
                  {favoriteCount}
                </span>
              )}
              <div className="absolute top-full mt-0.5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Favorites
              </div>
            </button>

            {/* Notifications */}
            <div ref={notifRef} data-notif className="relative">
              <button
                onClick={toggleNotif}
                className="text-white p-2 rounded-lg hover:bg-white/10 hover:scale-105 transition-all duration-200 relative group"
              >
                <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
                <div className="absolute top-full mt-0.5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Notifications
                </div>
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-sm">Notifications</span>

                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <span className="text-xs text-[#4a3689] font-medium">
                          {unreadCount} unread
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        disabled={unreadCount === 0}
                        className="text-xs font-medium text-[#4a3689] hover:underline disabled:opacity-40 disabled:hover:no-underline"
                      >
                        Read all
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                    {notifLoading ? (
                      <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
                    ) : notifications.length === 0 ? (
                      <p className="py-8 text-center text-sm text-gray-400">No notifications yet</p>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            if (!n.isRead) handleMarkAsRead(n.id);
                            setExpandedId((prev) => (prev === n.id ? null : n.id));
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${!n.isRead ? "bg-purple-50" : ""}`}
                        >
                          <span
                            className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${!n.isRead ? "bg-[#4a3689]" : "bg-transparent"}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm truncate ${!n.isRead ? "font-semibold text-gray-900" : "text-gray-600"}`}
                            >
                              {n.title}
                            </p>
                            <p
                              className={`text-xs text-gray-500 mt-0.5 ${expandedId === n.id ? "break-words" : "truncate"}`}
                            >
                              {n.body}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Chat */}
            <button
              onClick={() => navigate("/chat")}
              className="text-white p-2 rounded-lg hover:bg-white/10 hover:scale-105 transition-all duration-200 relative group"
            >
              <MessageCircle className="w-4 h-4 lg:w-5 lg:h-5" />
              {chatCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold rounded-full w-4 h-4 lg:w-5 lg:h-5 flex items-center justify-center">
                  {chatCount}
                </span>
              )}
              <div className="absolute top-full mt-0.5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Messages
              </div>
            </button>

            {/* Sell CTA */}
            <button
              onClick={() => navigate("/create-product")}
              className="bg-white text-[#4B0082] font-semibold px-4 py-2 rounded-lg hover:bg-white/90 hover:scale-105 transition-all duration-200 text-sm whitespace-nowrap"
            >
              Sell Now
            </button>

            {/* Divider */}
            <div className="h-8 w-px bg-white/20"></div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 lg:gap-3 text-white p-2 pr-3 rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center font-semibold text-white text-sm overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    displayAvatar
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setIsProfileOpen(false)}
                  ></div>

                  {/* Menu */}
                  <div className="absolute top-full right-0 mt-3 w-72 max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center font-semibold text-white text-base overflow-hidden">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            displayAvatar
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-[15px]">{displayName}</p>
                          <p className="text-gray-500 text-[13px]">{user?.email ?? ""}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate("/my-profile");
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-[14px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </button>
                      <button
                        onClick={() => {
                          navigate("/my-products");
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-[14px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        My Products
                      </button>
                      <button
                        onClick={() => {
                          navigate("/activity-history");
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-[14px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <History className="w-4 h-4" />
                        Activity
                      </button>
                      <button
                        onClick={() => {
                          navigate("/account-settings");
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-[14px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Settings
                      </button>
                    </div>

                    {/* Admin Section - Only show for admin/manager users */}
                    {isAdmin && (
                      <>
                        <div className="border-t border-gray-100 pt-2 mt-2"></div>
                        <div className="px-4 py-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Admin Panel
                          </p>
                        </div>
                        <div className="py-2">
                          <button
                            onClick={() => {
                              navigate("/admin/dashboard");
                              setIsProfileOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-[14px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                          >
                            <Shield className="w-4 h-4" />
                            Dashboard
                          </button>
                          <button
                            onClick={() => {
                              navigate("/admin/users");
                              setIsProfileOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-[14px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                          >
                            <User className="w-4 h-4" />
                            User Management
                          </button>
                          <button
                            onClick={() => {
                              navigate("/admin/products");
                              setIsProfileOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-[14px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Product Moderation
                          </button>
                          <button
                            onClick={() => {
                              navigate("/admin/orders");
                              setIsProfileOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-[14px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                              />
                            </svg>
                            Order Management
                          </button>
                          <button
                            onClick={() => {
                              navigate("/admin/reviews");
                              setIsProfileOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-[14px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                              />
                            </svg>
                            Reviews & Ratings
                          </button>
                          <button
                            onClick={() => {
                              navigate("/admin/reports");
                              setIsProfileOpen(false);
                            }}
                            className="w-full px-4 py-2.5 text-left text-[14px] text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            </svg>
                            Reports
                          </button>
                        </div>
                      </>
                    )}

                    {/* Logout */}
                    <div className="border-t border-gray-100 pt-2 mt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left text-[14px] text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 font-medium"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden mt-4">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/20 pt-4 space-y-3">
            {/* Sell Now CTA */}
            <button
              onClick={() => {
                navigate("/create-product");
                setIsMobileMenuOpen(false);
              }}
              className="w-full bg-white text-[#4B0082] font-semibold px-4 py-3 rounded-lg hover:bg-white/90 transition-all duration-200 text-[15px]"
            >
              Sell Now
            </button>
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  navigate("/favorites");
                  setIsMobileMenuOpen(false);
                }}
                className="text-white p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2 relative"
              >
                <Heart className="w-5 h-5" />
                <span className="text-sm">Favorites</span>
                {favoriteCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FF4B6E] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {favoriteCount}
                  </span>
                )}
              </button>
              <button
                onClick={toggleNotif}
                data-notif
                className="text-white p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2 relative"
              >
                <Bell className="w-5 h-5" />
                <span className="text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  navigate("/chat");
                  setIsMobileMenuOpen(false);
                }}
                className="text-white p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2 relative"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">Messages</span>
                {chatCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {chatCount}
                  </span>
                )}
              </button>
            </div>

            {isNotifOpen && (
              <div
                data-notif
                className="w-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-semibold text-gray-900 text-sm">Notifications</span>

                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <span className="text-xs text-[#4a3689] font-medium">
                        {unreadCount} unread
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      disabled={unreadCount === 0}
                      className="text-xs font-medium text-[#4a3689] hover:underline disabled:opacity-40 disabled:hover:no-underline"
                    >
                      Read all
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {notifLoading ? (
                    <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
                  ) : notifications.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-400">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          if (!n.isRead) handleMarkAsRead(n.id);
                          setExpandedId((prev) => (prev === n.id ? null : n.id));
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                          !n.isRead ? "bg-purple-50" : ""
                        }`}
                      >
                        <span
                          className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${
                            !n.isRead ? "bg-[#4a3689]" : "bg-transparent"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm truncate ${
                              !n.isRead ? "font-semibold text-gray-900" : "text-gray-600"
                            }`}
                          >
                            {n.title}
                          </p>
                          <p
                            className={`text-xs text-gray-500 mt-0.5 ${expandedId === n.id ? "break-words" : "truncate"}`}
                          >
                            {n.body}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Profile Links */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  navigate("/my-profile");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-white text-[15px] font-medium px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-left flex items-center gap-3"
              >
                <User className="w-5 h-5" />
                My Profile
              </button>
              <button
                onClick={() => {
                  navigate("/my-products");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-white text-[15px] font-medium px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-left flex items-center gap-3"
              >
                <ShoppingCart className="w-5 h-5" />
                My Products
              </button>
              <button
                onClick={() => {
                  navigate("/activity-history");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-white text-[15px] font-medium px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-left flex items-center gap-3"
              >
                <History className="w-5 h-5" />
                Activity
              </button>
              <button
                onClick={() => {
                  navigate("/account-settings");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-white text-[15px] font-medium px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-left flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </button>
            </div>

            {/* Admin Links (if applicable) */}
            {isAdmin && (
              <>
                <div className="border-t border-white/20 pt-3 mt-3">
                  <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2 px-2">
                    Admin Panel
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigate("/admin/dashboard");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-white text-[15px] font-medium px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-left flex items-center gap-3"
                >
                  <Shield className="w-5 h-5" />
                  Admin Dashboard
                </button>
              </>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full text-white text-[15px] font-medium px-4 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-all duration-200 text-left flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Log Out
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
