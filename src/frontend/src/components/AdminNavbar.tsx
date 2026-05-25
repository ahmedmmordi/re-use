import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  DollarSign,
  Star,
  Flag,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  BarChart3,
  FolderTree,
} from "lucide-react";
import { getAdminCategoryTree, type CategoryResponse } from "../services/categoryService";
import { useAuth } from "../context/AuthContext";

function rollupCount(node: CategoryResponse): number {
  const subSum = (node.subcategories ?? []).reduce((sum, s) => sum + rollupCount(s), 0);
  return node.productCount + subSum;
}

export function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;

    getAdminCategoryTree()
      .then((data) => {
        if (cancelled) return;
        const total = data.reduce((sum, c) => sum + rollupCount(c), 0);
        setTotalProducts(total);
        setTotalCategories(data.length);
      })
      .catch(() => {
        if (!cancelled) setTotalProducts(0);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // TODO: One of the next two should be the fullName of the user once the backend returns it
  const displayName = user?.email ?? "User";
  const displayAvatar = (user?.email?.[0] ?? "U").toUpperCase();

  const navGroups = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin/dashboard",
      single: true,
    },
    {
      label: "Catalog",
      icon: Package,
      single: false,
      items: [
        { icon: Package, label: "Products", path: "/admin/products" },
        { icon: FolderTree, label: "Categories", path: "/admin/categories" },
      ],
    },
    {
      label: "Commerce",
      icon: ShoppingBag,
      single: false,
      items: [
        { icon: ShoppingBag, label: "Orders", path: "/admin/orders" },
        { icon: DollarSign, label: "Payments", path: "/admin/payments" },
      ],
    },
    {
      label: "Community",
      icon: Users,
      single: false,
      items: [
        { icon: Users, label: "Users", path: "/admin/users" },
        { icon: Star, label: "Reviews", path: "/admin/reviews" },
        { icon: Flag, label: "Reports", path: "/admin/reports" },
      ],
    },
    {
      label: "System",
      icon: Bell,
      single: false,
      items: [
        { icon: Bell, label: "Notifications", path: "/admin/broadcast" },
        { icon: FileText, label: "Logs", path: "/admin/logs" },
      ],
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] shadow-xl sticky top-0 z-50">
      <div className="max-w-[1800px] mx-auto px-6">
        {/* Main Navigation */}
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <button onClick={() => navigate("/")} className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                <LayoutDashboard className="w-6 h-6 text-[#4B0082]" />
              </div>
              <div className="hidden sm:block">
                <div className="text-white font-bold text-lg leading-tight">Admin Panel</div>
                <div className="text-white/70 text-xs">ReUse Marketplace</div>
              </div>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden xl:flex items-center gap-1" ref={navRef}>
              {navGroups.map((group) => {
                const Icon = group.icon;
                if (group.single) {
                  const active = isActive(group.path!);
                  return (
                    <button
                      key={group.label}
                      onClick={() => navigate(group.path!)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? "bg-white text-[#4B0082] shadow-md"
                          : "text-white/90 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{group.label}</span>
                    </button>
                  );
                }
                const isOpen = openGroup === group.label;
                const groupActive = group.items!.some((i) => isActive(i.path));
                return (
                  <div key={group.label} className="relative">
                    <button
                      onClick={() => setOpenGroup(isOpen ? null : group.label)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        groupActive
                          ? "bg-white text-[#4B0082] shadow-md"
                          : "text-white/90 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{group.label}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 z-[9999]">
                        {group.items!.map((item) => {
                          const ItemIcon = item.icon;
                          const active = isActive(item.path);
                          return (
                            <button
                              key={item.path}
                              onClick={() => {
                                navigate(item.path);
                                setOpenGroup(null);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                active
                                  ? "bg-purple-50 text-[#4B0082] font-medium"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <ItemIcon className="w-4 h-4" />
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Stats Quick View - Desktop Only */}
            <div className="hidden lg:flex items-center gap-6 pr-6 border-r border-white/20">
              <div className="text-center">
                <div className="text-xs text-white/70">Users</div>
                {/*TODO: Use the real users count instead of this dummy value*/}
                <div className="text-white font-bold text-lg">5</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-white/70">Categories</div>
                <div className="text-white font-bold text-lg">{totalCategories}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-white/70">Products</div>
                <div className="text-white font-bold text-lg">{totalProducts.toLocaleString()}</div>
              </div>
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{displayAvatar}</span>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-white text-sm font-medium leading-tight">{displayName}</div>
                  <div className="text-white/70 text-xs">{user?.role || "Admin"}</div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-white transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-95 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-[#3d2e7c] to-[#4a3689]">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-white text-lg font-bold">
                          {(user?.email?.[0] ?? "A").toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">{user?.email ?? "Admin"}</div>
                        <div className="text-white/80 text-xs">
                          {user?.email || "admin@reuse.com"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => {
                        // TODO: Check if it's fine or should be "/admin/my-profile"
                        navigate("/my-profile");
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <Users className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate("/admin/settings");
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate("/admin/analytics");
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <BarChart3 className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Analytics</span>
                    </button>

                    <div className="my-2 border-t border-gray-100"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600 font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-white/20">
            <div className="space-y-1">
              {navGroups
                .flatMap((group) =>
                  group.single
                    ? [{ icon: group.icon, label: group.label, path: group.path! }]
                    : group.items!
                )
                .map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        active ? "bg-white text-[#4B0082]" : "text-white/90 hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
