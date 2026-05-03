import { useNavigate } from "react-router";
import { SignUpPage } from "../components/SignUpPage";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function SignUpPageWrapper() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // If already authenticated, skip to home
  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const handleNavigateToVerification = (data: { userName: string; email: string }) => {
    // Store user data temporarily (in real app, would be in context/localStorage)
    sessionStorage.setItem("pendingUserData", JSON.stringify(data));
    // Navigate to verification page
    navigate("/verification");
  };

  return (
    <SignUpPage
      onNavigateToLogin={() => navigate("/login")}
      onNavigateToVerification={handleNavigateToVerification}
    />
  );
}
