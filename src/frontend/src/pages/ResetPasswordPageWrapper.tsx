import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ResetPasswordPage } from "../components/ResetPasswordPage";

export default function ResetPasswordPageWrapper() {
  const navigate = useNavigate();
  const resetToken = sessionStorage.getItem("pendingPasswordResetToken");

  useEffect(() => {
    if (!resetToken) {
      navigate("/forgot-password", { replace: true });
    }
  }, [resetToken, navigate]);

  if (!resetToken) {
    return null;
  }

  const handleResetSuccess = () => {
    sessionStorage.removeItem("pendingPasswordResetEmail");
    sessionStorage.removeItem("pendingPasswordResetToken");
    navigate("/login", {
      state: {
        message: "Password reset successfully. You can now log in.",
      },
    });
  };

  return (
    <ResetPasswordPage
      resetToken={resetToken}
      onNavigateToLogin={() => navigate("/login")}
      onResetSuccess={handleResetSuccess}
    />
  );
}
