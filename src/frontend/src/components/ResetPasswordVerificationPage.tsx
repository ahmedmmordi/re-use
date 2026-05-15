import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { verifyPasswordReset, requestPasswordReset } from "../services/passwordResetService";

interface ResetPasswordVerificationPageProps {
  email: string;
  onNavigateToLogin?: () => void;
  onVerified?: (resetToken: string) => void;
}

export function ResetPasswordVerificationPage({
  email,
  onNavigateToLogin,
  onVerified,
}: ResetPasswordVerificationPageProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== "") && index === 5) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, 6);

    if (!/^\d+$/.test(pasted)) return;

    const newOtp = pasted.split("");
    setOtp(newOtp);

    if (pasted.length === 6) {
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code?: string) => {
    const verificationCode = code || otp.join("");

    if (verificationCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const { resetToken } = await verifyPasswordReset({
        email,
        otp: verificationCode,
      });
      onVerified?.(resetToken);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid or expired code. Please try again.";
      setError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    try {
      await requestPasswordReset({ email });
      setTimeLeft(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      setError("");
      inputRefs.current[0]?.focus();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resend code.";
      setError(message);
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
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#4B0082]/10 to-[#8B5CF6]/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-[#4B0082]" />
            </div>
            <h2 className="text-[32px] font-bold text-gray-900 mb-3">Enter Verification Code</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              We've sent a 6-digit code to
            </p>
            <p className="text-[15px] font-semibold text-[#4B0082]">{email}</p>
          </div>

          {/* OTP Inputs */}
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                maxLength={1}
                inputMode="numeric"
                className={`w-12 h-14 text-center text-[20px] font-semibold rounded-lg border-2 transition-colors ${
                  error
                    ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    : "border-gray-200 focus:border-[#4B0082] focus:ring-2 focus:ring-[#4B0082]/20 focus:outline-none"
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-[13px] text-center flex items-center justify-center gap-1">
              <span>⚠</span>
              {error}
            </p>
          )}

          {/* Resend / Timer */}
          <div className="text-center">
            {!canResend ? (
              <p className="text-[14px] text-gray-500">
                Resend code in <span className="font-semibold text-gray-700">{timeLeft}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-[14px] text-[#4B0082] font-medium hover:underline"
              >
                Resend Code
              </button>
            )}
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={otp.some((d) => !d) || isVerifying}
            className="w-full bg-gradient-to-r from-[#4B0082] to-[#3d2e7c] text-white text-[16px] font-semibold py-4 rounded-xl hover:from-[#3d2e7c] hover:to-[#2f2360] hover:shadow-xl hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isVerifying ? (
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
                Verifying...
              </span>
            ) : (
              "Verify Code"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
