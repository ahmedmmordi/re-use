import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface GuestRouteProps {
  redirectTo?: string;
}

export function GuestRoute({ redirectTo = "/" }: GuestRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  // If user is logged in → block access
  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Otherwise allow access
  return <Outlet />;
}
