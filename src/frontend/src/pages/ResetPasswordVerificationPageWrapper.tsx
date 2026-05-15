import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ResetPasswordVerificationPage } from "../components/ResetPasswordVerificationPage";

export default function ResetPasswordVerificationPageWrapper() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem("pendingPasswordResetEmail");

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password", { replace: true });
    }
  }, [email, navigate]);

  if (!email) {
    return null;
  }

  const handleVerified = (resetToken: string) => {
    sessionStorage.setItem("pendingPasswordResetToken", resetToken);
    navigate("/reset-password");
  };

  return (
    <ResetPasswordVerificationPage
      email={email}
      onNavigateToLogin={() => navigate("/login")}
      onVerified={handleVerified}
    />
  );
}
