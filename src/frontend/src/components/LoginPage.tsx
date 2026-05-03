import { useState } from "react";
import { useLocation } from "react-router";
import { CheckCircle } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AuthError, type AuthUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<AuthUser>;
  onNavigateToSignUp?: () => void;
  onNavigateToForgotPassword?: () => void;
  onLoginSuccess?: () => void;
}

export function LoginPage({
  onLogin,
  onNavigateToSignUp,
  onNavigateToForgotPassword,
  onLoginSuccess,
}: LoginPageProps) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { setUser } = useAuth();
  const location = useLocation();
  const successMessage = location.state?.message;

  // ── Validation ─────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      next.email = "Email is required";
    } else if (!emailRe.test(formData.email)) {
      next.email = "Invalid email address";
    }

    if (!formData.password) {
      next.password = "Password is required";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  // ── Submit ─────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const userData = await onLogin(formData.email, formData.password);

      setShowSuccess(true);

      setTimeout(() => {
        setUser(userData);
        setShowSuccess(false);
        onLoginSuccess?.();
      }, 2000);
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.status === 401 || err.status === 403) {
          setErrors({ password: "Invalid email or password" });
        } else if (err.status === 400) {
          setErrors({ general: err.message });
        } else {
          setErrors({ general: "Something went wrong. Please try again." });
        }
      } else {
        setErrors({ general: "Network error. Please check your connection." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f7fc] via-[#fef8fb] to-[#f3f0f9] flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-100/20 to-pink-100/20 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <div className="mb-8 md:mb-12 text-center z-10">
        <div className="inline-block bg-gradient-to-r from-[#4B0082]/5 to-[#8B5CF6]/5 px-8 md:px-12 py-5 md:py-6 rounded-2xl md:rounded-3xl backdrop-blur-sm border border-purple-100/50 shadow-lg">
          <h1
            className="text-[48px] md:text-[64px] font-normal italic text-transparent bg-clip-text bg-gradient-to-r from-[#4B0082] to-[#8B5CF6]"
            style={{ fontFamily: "'Pacifico', cursive" }}
          >
            ReUse
          </h1>
          <p className="text-gray-600 text-[14px] md:text-[15px] mt-2 font-medium tracking-wide">
            Welcome Back to Your Sustainable Marketplace
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-[460px] bg-white rounded-2xl shadow-2xl shadow-purple-100/50 border border-gray-100/50 p-8 md:p-10 z-10">
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {errors.general && (
            <div className="flex items-start gap-3 bg-red-50/80 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[14px] shadow-sm animate-in fade-in duration-200">
              {/* Icon */}
              <div className="mt-[2px] text-red-500 flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z"
                  />
                </svg>
              </div>

              {/* Content */}
              <div className="flex-1">
                <p className="font-semibold leading-tight">Login Failed</p>
                <p className="text-[13px] text-red-600 mt-[2px]">{errors.general}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-[14px] animate-in fade-in duration-300">
              <CheckCircle className="w-5 h-5 mt-[2px] text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold">Email Verified</p>
                <p className="text-[13px] text-green-600">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[14px] font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => {
                setFormData((p) => ({ ...p, email: e.target.value }));
                clearFieldError("email");
              }}
              className={`h-12 text-[15px] ${
                errors.email
                  ? "border-red-500 focus-visible:ring-red-500"
                  : "focus-visible:ring-[#4B0082] focus-visible:border-[#4B0082]"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-[13px] flex items-center gap-1">
                <span>⚠</span> {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[14px] font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, password: e.target.value }));
                  clearFieldError("password");
                }}
                className={`h-12 text-[15px] pr-12 ${
                  errors.password
                    ? "border-red-500 focus-visible:ring-red-500"
                    : "focus-visible:ring-[#4B0082] focus-visible:border-[#4B0082]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-[13px] flex items-center gap-1">
                <span>⚠</span> {errors.password}
              </p>
            )}
          </div>

          {/* Forgot */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onNavigateToForgotPassword}
              className="text-[14px] text-[#4B0082] hover:underline font-medium"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
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
                Logging In...
              </span>
            ) : (
              "Log In"
            )}
          </button>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-[14px] text-gray-600">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={onNavigateToSignUp}
                className="text-[#4B0082] font-semibold hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        </form>
      </div>

      {/* Success overlay */}
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
              <h3 className="text-[28px] font-bold text-gray-900 mb-3">Welcome Back!</h3>
              <p className="text-[16px] text-gray-600 mb-2">You've successfully logged in.</p>
              <p className="text-[14px] text-gray-500">Redirecting you to your dashboard...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
