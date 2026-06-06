import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Eye,
  Shield,
  ShieldOff,
  Trash2,
  CheckCircle,
  MoreVertical,
  UserPlus,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Pagination } from "./ui/Pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  blockAdminUser,
  unlockAdminUser,
  type AdminUserResponse,
  type AdminUserRole,
} from "../services/userService";
import { AuthError } from "../services/authService";

const PAGE_SIZE = 9;

type Banner = { kind: "success"; message: string } | { kind: "error"; message: string } | null;

function getErrorMessage(err: unknown): string {
  if (err instanceof AuthError && !err.message && err.errors) {
    if (typeof err.errors === "string") return err.errors;
    const first = Object.values(err.errors).flat()[0];
    if (first) return first;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function primaryRole(user: AdminUserResponse): AdminUserRole {
  return user.roles.includes("Admin") ? "Admin" : "User";
}

export function UserManagementPage() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<number | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [banner, setBanner] = useState<Banner>(null);
  const bannerTimer = useRef<number | null>(null);

  const [selectedUser, setSelectedUser] = useState<AdminUserResponse | null>(null);
  const [actionType, setActionType] = useState<"block" | "delete" | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    userName: "",
    fullName: "",
    email: "",
    password: "",
    role: "User" as AdminUserRole,
  });

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

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPageNumber(1);
    }, 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const loadUsers = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await getAdminUsers({
        pageNumber,
        pageSize: PAGE_SIZE,
        searchTerm: searchTerm || undefined,
        role: roleFilter !== "all" ? (roleFilter as AdminUserRole) : undefined,
        isActive: statusFilter !== "all" ? statusFilter === "active" : undefined,
        sortBy: "FullName",
        sortOrder: "Asc",
      });
      setUsers(result.data);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [all, blocked] = await Promise.all([
        getAdminUsers({ pageSize: 1 }),
        getAdminUsers({ pageSize: 1, isActive: false }),
      ]);
      setTotalUsers(all.totalRecords);
      setBlockedUsers(blocked.totalRecords);
    } catch {
      /* stats are non-critical */
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    loadStats();
  }, []);

  const refreshAll = async () => {
    await Promise.all([loadUsers(), loadStats()]);
  };

  const handleRoleChange = async (user: AdminUserResponse, newRole: AdminUserRole) => {
    if (primaryRole(user) === newRole) return;
    try {
      await updateAdminUser(user.id, { role: newRole });
      showBanner({ kind: "success", message: `User role updated to ${newRole}` });
      await loadUsers();
    } catch (err) {
      showBanner({ kind: "error", message: getErrorMessage(err) });
    }
  };

  const handleBlockUser = async (user: AdminUserResponse) => {
    setIsSubmitting(true);
    try {
      if (user.isActive) {
        await blockAdminUser(user.id);
        showBanner({ kind: "success", message: "User blocked successfully" });
      } else {
        await unlockAdminUser(user.id);
        showBanner({ kind: "success", message: "User unblocked successfully" });
      }
      setShowDialog(false);
      await refreshAll();
    } catch (err) {
      showBanner({ kind: "error", message: getErrorMessage(err) });
      setShowDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user: AdminUserResponse) => {
    setIsSubmitting(true);
    try {
      await deleteAdminUser(user.id);
      showBanner({ kind: "success", message: "User deleted successfully" });
      setShowDialog(false);
      await refreshAll();
    } catch (err) {
      showBanner({ kind: "error", message: getErrorMessage(err) });
      setShowDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async () => {
    setIsSubmitting(true);
    try {
      await createAdminUser({
        ...createForm,
        userName: createForm.userName.trim(),
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
      });
      showBanner({ kind: "success", message: "User created successfully" });
      setShowCreate(false);
      setCreateForm({ userName: "", fullName: "", email: "", password: "", role: "User" });
      await refreshAll();
    } catch (err) {
      showBanner({ kind: "error", message: getErrorMessage(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openConfirmDialog = (user: AdminUserResponse, action: "block" | "delete") => {
    setSelectedUser(user);
    setActionType(action);
    setShowDialog(true);
  };

  const trimmedUserName = createForm.userName.trim();
  const userNameError =
    trimmedUserName && !/^[a-zA-Z0-9_]+$/.test(trimmedUserName)
      ? "Username can only contain letters, numbers, and underscores"
      : null;

  const trimmedEmail = createForm.email.trim();
  const emailError =
    trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
      ? "Please enter a valid email address"
      : null;

  const passwordError = createForm.password
    ? createForm.password.length < 8
      ? "Password must be at least 8 characters"
      : !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$/.test(createForm.password)
        ? "Password must contain upper, lower, digit, and special character"
        : null
    : null;

  const createFormValid =
    trimmedUserName &&
    !userNameError &&
    createForm.fullName.trim() &&
    trimmedEmail &&
    !emailError &&
    createForm.password &&
    !passwordError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1600px] mx-auto px-8 py-12">
        {/* Banner */}
        {banner && (
          <div
            className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
              banner.kind === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {banner.kind === "success" ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            {banner.message}
          </div>
        )}

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">User Management</h1>
              <p className="text-gray-600 text-lg">Manage users, roles, and permissions</p>
            </div>

            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] text-white rounded-xl hover:shadow-xl transition-all duration-200 font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-white border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Total Users</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalUsers ?? "—"}</p>
          </Card>

          <Card className="p-6 bg-white border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Blocked Users</span>
              <ShieldOff className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{blockedUsers ?? "—"}</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 bg-white border border-gray-100 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                name="user-search"
                autoComplete="off"
                placeholder="Search users by name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-12 pr-12 h-12 bg-gray-50 border-gray-200 focus:border-[#3d2e7c] focus:ring-[#3d2e7c]"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value);
                setPageNumber(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[200px] h-12 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="User">User</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPageNumber(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[200px] h-12 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Users Table */}
        <Card className="bg-white border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500">Loading users…</p>
            </div>
          ) : loadError ? (
            <div className="text-center py-16">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600">{loadError}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No users found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-8 py-5 text-left text-base font-semibold text-gray-900">
                      User
                    </th>
                    <th className="px-8 py-5 text-left text-base font-semibold text-gray-900">
                      Role
                    </th>
                    <th className="px-8 py-5 text-left text-base font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-8 py-5 text-left text-base font-semibold text-gray-900">
                      Joined
                    </th>
                    <th className="px-8 py-5 text-right text-base font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-6">
                        <div
                          onClick={() => navigate(`/profile/${user.id}`)}
                          className="flex items-center gap-4 cursor-pointer group"
                        >
                          <Avatar className="w-14 h-14 border-2 border-gray-200">
                            <AvatarImage
                              src={user.profileImageUrl ?? undefined}
                              alt={user.fullName}
                            />
                            <AvatarFallback>
                              {user.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900 text-base group-hover:text-[#3d2e7c] group-hover:underline transition-colors">
                              {user.fullName}
                            </p>
                            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <Select
                          value={primaryRole(user)}
                          onValueChange={(value) => handleRoleChange(user, value as AdminUserRole)}
                        >
                          <SelectTrigger className="w-[140px] h-9 border-0 bg-transparent">
                            <Badge
                              className={`${
                                primaryRole(user) === "Admin"
                                  ? "bg-red-100 text-red-700 hover:bg-red-100"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                              } text-sm px-3 py-1.5`}
                            >
                              {primaryRole(user)}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="User">User</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-8 py-6">
                        <Badge
                          className={`${
                            user.isActive
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : "bg-red-100 text-red-700 hover:bg-red-100"
                          } text-sm px-3 py-1.5`}
                        >
                          {user.isActive ? "Active" : "Blocked"}
                        </Badge>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-gray-600 text-sm">{formatDate(user.createdAt)}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => navigate(`/profile/${user.id}`)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openConfirmDialog(user, "block")}>
                              {user.isActive ? (
                                <>
                                  <ShieldOff className="w-4 h-4 mr-2" />
                                  Block User
                                </>
                              ) : (
                                <>
                                  <Shield className="w-4 h-4 mr-2" />
                                  Unblock User
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openConfirmDialog(user, "delete")}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {!isLoading && !loadError && (
          <Pagination
            currentPage={pageNumber}
            totalPages={totalPages}
            onPageChange={setPageNumber}
          />
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "delete"
                ? "Delete User"
                : selectedUser?.isActive
                  ? "Block User"
                  : "Unblock User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "delete"
                ? `Are you sure you want to delete ${selectedUser?.fullName}? This action cannot be undone.`
                : selectedUser?.isActive
                  ? `Are you sure you want to block ${selectedUser?.fullName}? They will lose access to the platform.`
                  : `Are you sure you want to unblock ${selectedUser?.fullName}? They will regain access to the platform.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                if (!selectedUser) return;
                if (actionType === "delete") {
                  handleDeleteUser(selectedUser);
                } else {
                  handleBlockUser(selectedUser);
                }
              }}
              className={actionType === "delete" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {actionType === "delete" ? "Delete" : selectedUser?.isActive ? "Block" : "Unblock"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isSubmitting && setShowCreate(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Add User</h2>
            <p className="text-sm text-gray-500 mb-6">Create a new user account.</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Username</label>
                <Input
                  value={createForm.userName}
                  onChange={(e) => setCreateForm({ ...createForm, userName: e.target.value })}
                  placeholder="username"
                />
                {userNameError && <p className="text-sm text-red-600 mt-1.5">{userNameError}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Name</label>
                <Input
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
                <Input
                  type="email"
                  autoComplete="off"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="email@example.com"
                />
                {emailError && <p className="text-sm text-red-600 mt-1.5">{emailError}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Password"
                />
                {passwordError && <p className="text-sm text-red-600 mt-1.5">{passwordError}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Role</label>
                <Select
                  value={createForm.role}
                  onValueChange={(value) =>
                    setCreateForm({ ...createForm, role: value as AdminUserRole })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={isSubmitting || !createFormValid}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
