import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { sendEmailConfirmation } from "../services/emailConfirmationsService";
import { verifyOtp } from "../services/emailConfirmationsService";

interface VerificationPageProps {
  onNavigateToLogin?: () => void;
  onVerificationSuccess?: () => void;
  userEmail?: string;
}

export function VerificationPage({
  onNavigateToLogin,
  onVerificationSuccess,
  userEmail = "user@example.com",
}: VerificationPageProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ✅ Send OTP on mount
  useEffect(() => {
    const sendOtp = async () => {
      await sendEmailConfirmation({ email: userEmail });
    };
    sendOtp();
  }, [userEmail]);

  // ⏱ Timer
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

  // ✅ Verify OTP (PUT)
  const handleVerify = async (code?: string) => {
    const verificationCode = code || otp.join("");

    if (verificationCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      await verifyOtp({
        email: userEmail,
        otp: verificationCode,
      });
      onVerificationSuccess?.();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // 🔁 Resend OTP
  const handleResend = async () => {
    if (!canResend) return;

    try {
      await sendEmailConfirmation({ email: userEmail });
      setTimeLeft(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      setError("");
      inputRefs.current[0]?.focus();
    } catch {
      console.error("Resend failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Back */}
      <button
        onClick={onNavigateToLogin}
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:underline"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="bg-white p-8 rounded-xl shadow w-full max-w-md text-center">
        <Mail className="mx-auto mb-4 text-indigo-600" size={40} />

        <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
        <p className="text-gray-600 text-sm mb-4">
          Code sent to <span className="font-semibold">{userEmail}</span>
        </p>

        {/* OTP */}
        <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
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
              className="w-10 h-10 border text-center text-lg rounded"
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        {/* Timer */}
        {!canResend ? (
          <p className="text-sm text-gray-500 mb-4">Resend in {timeLeft}s</p>
        ) : (
          <button onClick={handleResend} className="text-indigo-600 text-sm mb-4 hover:underline">
            Resend Code
          </button>
        )}

        {/* Verify */}
        <button
          onClick={() => handleVerify()}
          disabled={otp.some((d) => !d) || isVerifying}
          className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-50"
        >
          {isVerifying ? "Verifying..." : "Verify Email"}
        </button>
      </div>
    </div>
  );
}
