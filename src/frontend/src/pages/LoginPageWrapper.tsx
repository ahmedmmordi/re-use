import { useNavigate } from "react-router";
import { LoginPage } from "../components/LoginPage";
import { useAuth } from "../context/AuthContext";

export default function LoginPageWrapper() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLoginSuccess = () => {
    navigate("/");
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
