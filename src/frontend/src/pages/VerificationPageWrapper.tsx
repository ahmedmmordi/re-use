import { useNavigate } from "react-router";
import { VerificationPage } from "../components/VerificationPage";

export default function VerificationPageWrapper() {
  const navigate = useNavigate();

  const pendingUserDataStr = sessionStorage.getItem("pendingUserData");
  const pendingUserData = pendingUserDataStr
    ? JSON.parse(pendingUserDataStr)
    : {
        name: "User",
        email: "user@example.com",
      };

  const handleVerificationSuccess = () => {
    sessionStorage.removeItem("pendingUserData");

    navigate("/login", {
      state: {
        message: "Email verified successfully. You can now log in.",
      },
    });
  };

  return (
    <VerificationPage
      onNavigateToLogin={() => navigate("/login")}
      onVerificationSuccess={handleVerificationSuccess}
      userEmail={pendingUserData.email}
    />
  );
}
