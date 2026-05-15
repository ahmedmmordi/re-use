import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { resetPassword } from "../services/passwordResetService";

interface ResetPasswordPageProps {
  resetToken: string;
  onNavigateToLogin?: () => void;
  onResetSuccess?: () => void;
}

const passwordRules = [
  { id: "length", label: "At least 8 characters", test: (pwd: string) => pwd.length >= 8 },
  { id: "uppercase", label: "One uppercase letter", test: (pwd: string) => /[A-Z]/.test(pwd) },
  { id: "lowercase", label: "One lowercase letter", test: (pwd: string) => /[a-z]/.test(pwd) },
  { id: "number", label: "One number", test: (pwd: string) => /\d/.test(pwd) },
  {
    id: "special",
    label: "One special character",
    test: (pwd: string) => /[^a-zA-Z0-9]/.test(pwd),
  },
];

export function ResetPasswordPage({
  resetToken,
  onNavigateToLogin,
  onResetSuccess,
}: ResetPasswordPageProps) {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (!passwordRules.every((rule) => rule.test(formData.newPassword))) {
      newErrors.newPassword = "Password does not meet all requirements";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSubmitError("");

    try {
      await resetPassword({ resetToken, newPassword: formData.newPassword });
      setShowSuccess(true);
      setTimeout(() => {
        onResetSuccess?.();
      }, 2000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reset password. Please try again.";
      setSubmitError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f7fc] via-[#fef8fb] to-[#f3f0f9] flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-100/20 to-pink-100/20 rounded-full blur-3xl"></div>
      </div>

      {/* Back Button */}
      <button
        onClick={onNavigateToLogin}
        className="absolute top-8 left-8 z-10 flex items-center gap-2 text-gray-600 hover:text-[#4B0082] transition-colors font-medium"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Login
      </button>

      {/* Logo Section */}
      <div className="mb-12 text-center z-10">
        <div className="inline-block bg-gradient-to-r from-[#4B0082]/5 to-[#8B5CF6]/5 px-12 py-6 rounded-3xl backdrop-blur-sm border border-purple-100/50 shadow-lg">
          <h1
            className="text-[64px] font-normal italic text-transparent bg-clip-text bg-gradient-to-r from-[#4B0082] to-[#8B5CF6]"
            style={{ fontFamily: "'Pacifico', cursive" }}
          >
            ReUse
          </h1>
        </div>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-2xl shadow-purple-100/50 border border-gray-100/50 p-10 relative z-10 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#4B0082]/10 to-[#8B5CF6]/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-[#4B0082]" />
            </div>
            <h2 className="text-[32px] font-bold text-gray-900 mb-3">Reset Password</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Create a strong password to secure your account
            </p>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-[14px] font-medium text-gray-700">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                className={`h-12 text-[15px] pr-12 ${
                  errors.newPassword
                    ? "border-red-500 focus-visible:ring-red-500"
                    : "focus-visible:ring-[#4B0082] focus-visible:border-[#4B0082]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                aria-label={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-[13px] mt-1 flex items-center gap-1">
                <span>⚠</span>
                {errors.newPassword}
              </p>
            )}
          </div>

          {/* Password Rules */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-[13px] font-semibold text-gray-700 mb-3">Password must contain:</p>
            {passwordRules.map((rule) => {
              const isValid = rule.test(formData.newPassword);
              return (
                <div key={rule.id} className="flex items-center gap-2">
                  {isValid ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  )}
                  <span
                    className={`text-[13px] ${
                      isValid ? "text-green-700 font-medium" : "text-gray-600"
                    }`}
                  >
                    {rule.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-[14px] font-medium text-gray-700">
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter new password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                className={`h-12 text-[15px] pr-12 ${
                  errors.confirmPassword
                    ? "border-red-500 focus-visible:ring-red-500"
                    : "focus-visible:ring-[#4B0082] focus-visible:border-[#4B0082]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-[13px] mt-1 flex items-center gap-1">
                <span>⚠</span>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {submitError && (
            <p className="text-red-500 text-[13px] text-center flex items-center justify-center gap-1">
              <span>⚠</span>
              {submitError}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#4B0082] to-[#3d2e7c] text-white text-[16px] font-semibold py-4 rounded-xl hover:from-[#3d2e7c] hover:to-[#2f2360] hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Resetting Password...
              </span>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h3 className="text-[28px] font-bold text-gray-900 mb-3">
                Password Reset Successful!
              </h3>
              <p className="text-[16px] text-gray-600 mb-2">Your password has been changed.</p>
              <p className="text-[14px] text-gray-500">Redirecting you to login...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
