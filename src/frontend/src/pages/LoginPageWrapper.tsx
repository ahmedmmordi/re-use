import { useNavigate } from "react-router-dom";
import { LoginPage } from "../components/LoginPage";
import { useAuth } from "../context/AuthContext";
import type { AuthUser } from "../services/authService";

export default function LoginPageWrapper() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLoginSuccess = (user?: AuthUser) => {
    if (user?.role === "Admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <LoginPage
      onLogin={login}
      onNavigateToSignUp={() => navigate("/signup")}
      onNavigateToForgotPassword={() => navigate("/forgot-password")}
      onLoginSuccess={handleLoginSuccess}
    />
  );
}
