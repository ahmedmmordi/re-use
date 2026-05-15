import { useState } from "react";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { requestPasswordReset } from "../services/passwordResetService";

interface ForgotPasswordPageProps {
  onNavigateToLogin?: () => void;
  onCodeSent?: (email: string) => void;
}

export function ForgotPasswordPage({ onNavigateToLogin, onCodeSent }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateInput = () => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateInput()) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await requestPasswordReset({ email });
      setShowSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    if (error) {
      setError("");
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
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl shadow-purple-100/50 border border-gray-100/50 p-10 relative z-10 backdrop-blur-xl">
        {!showSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#4B0082]/10 to-[#8B5CF6]/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-[#4B0082]" />
              </div>
              <h2 className="text-[32px] font-bold text-gray-900 mb-3">Forgot Password?</h2>
              <p className="text-[15px] text-gray-600 leading-relaxed">
                No worries! Enter your email address and we'll send you a verification code
              </p>
            </div>

            {/* Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[14px] font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => handleInputChange(e.target.value)}
                className={`h-12 text-[15px] ${
                  error
                    ? "border-red-500 focus-visible:ring-red-500"
                    : "focus-visible:ring-[#4B0082] focus-visible:border-[#4B0082]"
                }`}
              />
              {error && (
                <p className="text-red-500 text-[13px] mt-1 flex items-center gap-1">
                  <span>⚠</span>
                  {error}
                </p>
              )}
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-[13px] text-blue-800 leading-relaxed">
                <span className="font-semibold">Note:</span> A verification code will be sent to
                your email that you can use to reset your password.
              </p>
            </div>

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
                  Sending...
                </span>
              ) : (
                "Send Verification Code"
              )}
            </button>
          </form>
        ) : (
          /* Success State */
          <div className="text-center py-8">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>

            <h3 className="text-[28px] font-bold text-gray-900 mb-3">Check Your Email!</h3>

            <p className="text-[16px] text-gray-600 mb-2 leading-relaxed">
              We've sent a verification code to
            </p>
            <p className="text-[16px] font-semibold text-[#4B0082] mb-6">{email}</p>

            <div className="bg-gray-50 rounded-lg p-5 mb-6">
              <p className="text-[14px] text-gray-700 leading-relaxed">
                Enter the code on the next step to reset your password. The code will expire in 10
                minutes.
              </p>
            </div>

            <button
              onClick={() => onCodeSent?.(email)}
              className="w-full bg-gradient-to-r from-[#4B0082] to-[#3d2e7c] text-white text-[16px] font-semibold py-4 rounded-xl hover:from-[#3d2e7c] hover:to-[#2f2360] hover:shadow-xl hover:scale-[1.02] transition-all duration-200 mb-4"
            >
              Enter Verification Code
            </button>

            <button
              onClick={onNavigateToLogin}
              className="text-[14px] text-[#4B0082] font-medium hover:underline"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
