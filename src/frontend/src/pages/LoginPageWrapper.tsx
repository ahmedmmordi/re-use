import { useEffect } from "react";
import { useNavigate } from "react-router";
import { LoginPage } from "../components/LoginPage";
import { useAuth } from "../context/AuthContext";

export default function LoginPageWrapper() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // If already authenticated, skip to home
  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleLoginSuccess = () => {
    navigate("/login-success");
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
