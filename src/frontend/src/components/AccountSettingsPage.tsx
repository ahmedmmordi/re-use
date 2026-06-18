import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  Shield,
  Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuthError } from "../services/authService";
import { changePassword, deactivateAccount, deleteAccount } from "../services/accountService";
import type {
  ChangePasswordRequest,
  DeactivateAccountRequest,
  DeleteAccountRequest,
} from "../services/accountService";

// ─── Constants ───────────────────────────────────────────────────────────────

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const DELETE_CONFIRMATION_PHRASE = "DELETE MY ACCOUNT";

// ─── Inline primitives (no Radix required) ───────────────────────────────────

function Switch({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? "bg-[#3d2e7c]" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Separator() {
  return <div className="border-t border-gray-200" />;
}

// ─── PasswordStrength sub-component ──────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;

  const label = strength <= 2 ? "Weak" : strength <= 3 ? "Medium" : "Strong";
  const color =
    label === "Weak" ? "bg-red-500" : label === "Medium" ? "bg-yellow-500" : "bg-green-500";
  const width = label === "Weak" ? "33%" : label === "Medium" ? "66%" : "100%";

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">Password strength:</span>
        <span
          className={`text-xs font-semibold ${
            label === "Weak"
              ? "text-red-500"
              : label === "Medium"
                ? "text-yellow-600"
                : "text-green-600"
          }`}
        >
          {label}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-300 ${color}`} style={{ width }} />
      </div>
    </div>
  );
}

// ─── Modal (inline, no Radix) ────────────────────────────────────────────────

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AccountSettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // ── Banner ────────────────────────────────────────────────────────────────
  const [banner, setBanner] = useState<{
    kind: "success" | "error";
    msg: string;
  } | null>(null);

  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(timer);
  }, [banner]);

  // ── Change Password ───────────────────────────────────────────────────────
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwData, setPwData] = useState<ChangePasswordRequest>({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [isChangingPw, setIsChangingPw] = useState(false);

  const validatePassword = (): boolean => {
    const errors: Record<string, string> = {};

    if (!pwData.currentPassword) {
      errors.currentPassword = "Current password is required.";
    }

    if (!pwData.newPassword) {
      errors.newPassword = "New password is required.";
    } else if (!PASSWORD_REGEX.test(pwData.newPassword)) {
      errors.newPassword =
        "Password must be at least 8 characters and contain uppercase, lowercase, a number, and a special character.";
    } else if (pwData.newPassword === pwData.currentPassword) {
      errors.newPassword = "New password must be different from the current password.";
    }

    if (!pwData.confirmNewPassword) {
      errors.confirmNewPassword = "Please confirm your new password.";
    } else if (pwData.newPassword !== pwData.confirmNewPassword) {
      errors.confirmNewPassword = "Passwords do not match.";
    }

    setPwErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    setIsChangingPw(true);
    setBanner(null);
    try {
      await changePassword(pwData);
      setPwData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      setPwErrors({});
      setBanner({ kind: "success", msg: "Password changed successfully." });
    } catch (err) {
      if (err instanceof AuthError && err.status === 403) {
        setPwErrors((prev) => ({ ...prev, currentPassword: "Incorrect password." }));
      } else {
        const msg = err instanceof AuthError ? err.message : "An unexpected error occurred.";
        setBanner({ kind: "error", msg });
      }
    } finally {
      setIsChangingPw(false);
    }
  };

  // ── Deactivate ────────────────────────────────────────────────────────────
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateData, setDeactivateData] = useState<DeactivateAccountRequest>({
    password: "",
    reason: "",
  });
  const [deactivateErrors, setDeactivateErrors] = useState<Record<string, string>>({});
  const [isDeactivating, setIsDeactivating] = useState(false);

  const closeDeactivateModal = () => {
    setShowDeactivateModal(false);
    setDeactivateData({ password: "", reason: "" });
    setDeactivateErrors({});
  };

  const handleDeactivate = async () => {
    if (!deactivateData.password) {
      setDeactivateErrors({ password: "Password is required." });
      return;
    }
    setIsDeactivating(true);
    try {
      const payload: DeactivateAccountRequest = { password: deactivateData.password };
      if (deactivateData.reason?.trim()) payload.reason = deactivateData.reason.trim();
      await deactivateAccount(payload);
      closeDeactivateModal();
      await logout();
      navigate("/login");
    } catch (err) {
      if (err instanceof AuthError && err.status === 403) {
        setDeactivateErrors({ password: "Incorrect password." });
      } else if (err instanceof AuthError && err.status === 409) {
        closeDeactivateModal();
        setBanner({ kind: "error", msg: "Account is already deactivated." });
      } else {
        const msg = err instanceof AuthError ? err.message : "An unexpected error occurred.";
        closeDeactivateModal();
        setBanner({ kind: "error", msg });
      }
    } finally {
      setIsDeactivating(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteData, setDeleteData] = useState<DeleteAccountRequest>({
    password: "",
    confirmation: "",
    reason: "",
  });
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({});
  const [isDeleting, setIsDeleting] = useState(false);

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteData({ password: "", confirmation: "", reason: "" });
    setDeleteErrors({});
  };

  const handleDelete = async () => {
    const errors: Record<string, string> = {};
    if (!deleteData.password) errors.password = "Password is required.";
    if (deleteData.confirmation !== DELETE_CONFIRMATION_PHRASE) {
      errors.confirmation = `You must type exactly "${DELETE_CONFIRMATION_PHRASE}".`;
    }
    if (Object.keys(errors).length > 0) {
      setDeleteErrors(errors);
      return;
    }

    setIsDeleting(true);
    try {
      const payload: DeleteAccountRequest = {
        password: deleteData.password,
        confirmation: deleteData.confirmation,
      };
      if (deleteData.reason?.trim()) payload.reason = deleteData.reason.trim();
      await deleteAccount(payload);
      closeDeleteModal();
      await logout();
      navigate("/login");
    } catch (err) {
      if (err instanceof AuthError && err.status === 403) {
        setDeleteErrors((prev) => ({ ...prev, password: "Incorrect password." }));
      } else {
        const msg = err instanceof AuthError ? err.message : "An unexpected error occurred.";
        closeDeleteModal();
        setBanner({ kind: "error", msg });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 md:px-8 py-4">
          <button
            onClick={() => navigate("/my-profile")}
            className="flex items-center gap-2 text-gray-600 hover:text-[#3d2e7c] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back to Profile</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 md:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Page header */}
          <div className="bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] px-4 sm:px-6 md:px-8 py-6 md:py-8">
            <h1 className="text-white text-3xl font-bold mb-2">Account Settings</h1>
            <p className="text-purple-200">Manage your security and account preferences</p>
          </div>

          <div className="p-8 space-y-8">
            {/* Banner */}
            {banner && (
              <div
                className={`rounded-lg px-4 py-3 text-sm font-medium ${
                  banner.kind === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {banner.msg}
              </div>
            )}

            {/* ── Change Password ─────────────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#3d2e7c]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                  <p className="text-gray-500 text-sm">
                    Update your password regularly to keep your account secure
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-w-xl">
                {/* Current password */}
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="text-sm font-semibold text-gray-700 mb-2 block"
                  >
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      type={showCurrentPw ? "text" : "password"}
                      value={pwData.currentPassword}
                      onChange={(e) => {
                        setPwData((prev) => ({ ...prev, currentPassword: e.target.value }));
                        if (pwErrors.currentPassword)
                          setPwErrors((prev) => ({ ...prev, currentPassword: "" }));
                      }}
                      placeholder="Enter current password"
                      className={`w-full pr-10 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3d2e7c]/30 ${
                        pwErrors.currentPassword ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {pwErrors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1">{pwErrors.currentPassword}</p>
                  )}
                </div>

                {/* New password */}
                <div>
                  <label
                    htmlFor="newPassword"
                    className="text-sm font-semibold text-gray-700 mb-2 block"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPw ? "text" : "password"}
                      value={pwData.newPassword}
                      onChange={(e) => {
                        setPwData((prev) => ({ ...prev, newPassword: e.target.value }));
                        if (pwErrors.newPassword)
                          setPwErrors((prev) => ({ ...prev, newPassword: "" }));
                      }}
                      placeholder="Enter new password"
                      className={`w-full pr-10 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3d2e7c]/30 ${
                        pwErrors.newPassword ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {pwErrors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">{pwErrors.newPassword}</p>
                  )}
                  <PasswordStrength password={pwData.newPassword} />
                </div>

                {/* Confirm new password */}
                <div>
                  <label
                    htmlFor="confirmNewPassword"
                    className="text-sm font-semibold text-gray-700 mb-2 block"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmNewPassword"
                      type={showConfirmPw ? "text" : "password"}
                      value={pwData.confirmNewPassword}
                      onChange={(e) => {
                        setPwData((prev) => ({ ...prev, confirmNewPassword: e.target.value }));
                        if (pwErrors.confirmNewPassword)
                          setPwErrors((prev) => ({ ...prev, confirmNewPassword: "" }));
                      }}
                      placeholder="Confirm new password"
                      className={`w-full pr-10 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3d2e7c]/30 ${
                        pwErrors.confirmNewPassword ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {pwErrors.confirmNewPassword && (
                    <p className="text-red-500 text-xs mt-1">{pwErrors.confirmNewPassword}</p>
                  )}
                  {pwData.confirmNewPassword &&
                    pwData.newPassword === pwData.confirmNewPassword && (
                      <div className="flex items-center gap-2 text-green-600 text-sm mt-1">
                        <Check className="w-4 h-4" />
                        <span>Passwords match</span>
                      </div>
                    )}
                </div>

                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={isChangingPw}
                  className="inline-flex items-center justify-center gap-2 px-8 py-2 bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isChangingPw && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Update Password
                </button>
              </div>
            </section>

            <Separator />

            {/* ── Two-Factor Authentication (placeholder) ─────────────────── */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Two-Factor Authentication</h2>
                  <p className="text-gray-500 text-sm">
                    Add an extra layer of security to your account
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Enable Two-Factor Authentication
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Protect your account with an additional verification step during login
                    </p>
                    <span className="inline-block text-xs font-medium text-blue-600 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md">
                      Coming Soon
                    </span>
                  </div>
                  <Switch
                    checked={false}
                    onChange={() => undefined}
                    disabled
                    ariaLabel="Enable two-factor authentication"
                  />
                </div>
              </div>
            </section>

            <Separator />

            {/* ── Notification Preferences (placeholder) ──────────────────── */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
                  <p className="text-gray-500 text-sm">Manage how you receive notifications</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 border border-[#3d2e7c] text-[#3d2e7c] text-sm font-medium rounded-lg opacity-50 cursor-not-allowed"
                >
                  Manage Notifications
                </button>
                <span className="text-xs font-medium text-green-600 bg-green-100 border border-green-200 px-2 py-0.5 rounded-md">
                  Coming Soon
                </span>
              </div>
            </section>

            <Separator />

            {/* ── Danger Zone ─────────────────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Danger Zone</h2>
                  <p className="text-gray-500 text-sm">Irreversible account actions</p>
                </div>
              </div>

              <div className="space-y-4 max-w-xl">
                {/* Deactivate */}
                <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Deactivate Account</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Temporarily disable your account. You can reactivate it anytime by logging back
                    in.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeactivateModal(true)}
                    className="px-4 py-2 border border-yellow-600 text-yellow-700 text-sm font-medium rounded-lg hover:bg-yellow-100 transition-colors"
                  >
                    Deactivate Account
                  </button>
                </div>

                {/* Delete */}
                <div className="border border-red-200 bg-red-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Delete Account</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Permanently delete your account and all associated data. This action cannot be
                    undone.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ── Deactivate Modal ──────────────────────────────────────────────── */}
      <Modal open={showDeactivateModal} onClose={closeDeactivateModal}>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900">Deactivate Account?</h2>
          <p className="text-sm text-gray-600 mt-1">
            Your account will be temporarily disabled. You can reactivate it anytime by logging back
            in. Your listings will be hidden during this time.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Password */}
          <div>
            <label
              htmlFor="deactivatePassword"
              className="text-sm font-semibold text-gray-700 mb-2 block"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="deactivatePassword"
              type="password"
              value={deactivateData.password}
              onChange={(e) => {
                setDeactivateData((prev) => ({ ...prev, password: e.target.value }));
                if (deactivateErrors.password)
                  setDeactivateErrors((prev) => ({ ...prev, password: "" }));
              }}
              placeholder="Enter your password"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3d2e7c]/30 ${
                deactivateErrors.password ? "border-red-500" : "border-gray-300"
              }`}
            />
            {deactivateErrors.password && (
              <p className="text-red-500 text-xs mt-1">{deactivateErrors.password}</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label
              htmlFor="deactivateReason"
              className="text-sm font-semibold text-gray-700 mb-2 block"
            >
              Reason <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="deactivateReason"
              value={deactivateData.reason}
              onChange={(e) => setDeactivateData((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Why are you deactivating your account?"
              maxLength={500}
              rows={3}
              className="w-full resize-none px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3d2e7c]/30"
            />
            <p className="text-gray-400 text-xs text-right mt-0.5">
              {deactivateData.reason?.length ?? 0}/500
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeDeactivateModal}
            disabled={isDeactivating}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={isDeactivating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeactivating && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Deactivate Account
          </button>
        </div>
      </Modal>

      {/* ── Delete Modal ──────────────────────────────────────────────────── */}
      <Modal open={showDeleteModal} onClose={closeDeleteModal}>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-red-600">Delete Account Permanently?</h2>
          <p className="text-sm text-gray-600 mt-1">
            This action cannot be undone. This will permanently delete your account and remove all
            your data from our servers.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Password */}
          <div>
            <label
              htmlFor="deletePassword"
              className="text-sm font-semibold text-gray-700 mb-2 block"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="deletePassword"
              type="password"
              value={deleteData.password}
              onChange={(e) => {
                setDeleteData((prev) => ({ ...prev, password: e.target.value }));
                if (deleteErrors.password) setDeleteErrors((prev) => ({ ...prev, password: "" }));
              }}
              placeholder="Enter your password"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3d2e7c]/30 ${
                deleteErrors.password ? "border-red-500" : "border-gray-300"
              }`}
            />
            {deleteErrors.password && (
              <p className="text-red-500 text-xs mt-1">{deleteErrors.password}</p>
            )}
          </div>

          {/* Confirmation phrase */}
          <div>
            <label
              htmlFor="deleteConfirmation"
              className="text-sm font-semibold text-gray-700 mb-2 block"
            >
              Type <span className="font-bold text-red-600">{DELETE_CONFIRMATION_PHRASE}</span> to
              confirm
            </label>
            <input
              id="deleteConfirmation"
              type="text"
              value={deleteData.confirmation}
              onChange={(e) => {
                setDeleteData((prev) => ({ ...prev, confirmation: e.target.value }));
                if (deleteErrors.confirmation)
                  setDeleteErrors((prev) => ({ ...prev, confirmation: "" }));
              }}
              placeholder={DELETE_CONFIRMATION_PHRASE}
              className={`w-full font-mono px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3d2e7c]/30 ${
                deleteErrors.confirmation ? "border-red-500" : "border-gray-300"
              }`}
            />
            {deleteErrors.confirmation && (
              <p className="text-red-500 text-xs mt-1">{deleteErrors.confirmation}</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label
              htmlFor="deleteReason"
              className="text-sm font-semibold text-gray-700 mb-2 block"
            >
              Reason <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="deleteReason"
              value={deleteData.reason}
              onChange={(e) => setDeleteData((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Why are you deleting your account?"
              maxLength={500}
              rows={3}
              className="w-full resize-none px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3d2e7c]/30"
            />
            <p className="text-gray-400 text-xs text-right mt-0.5">
              {deleteData.reason?.length ?? 0}/500
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={closeDeleteModal}
            disabled={isDeleting}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || deleteData.confirmation !== DELETE_CONFIRMATION_PHRASE}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Delete Account Permanently
          </button>
        </div>
      </Modal>
    </div>
  );
}
