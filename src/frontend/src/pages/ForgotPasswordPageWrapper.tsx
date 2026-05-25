import { useNavigate } from "react-router-dom";
import { ForgotPasswordPage } from "../components/ForgotPasswordPage";

export default function ForgotPasswordPageWrapper() {
  const navigate = useNavigate();

  const handleCodeSent = (email: string) => {
    sessionStorage.setItem("pendingPasswordResetEmail", email);
    navigate("/reset-password/verify");
  };

  return (
    <ForgotPasswordPage onNavigateToLogin={() => navigate("/login")} onCodeSent={handleCodeSent} />
  );
}
