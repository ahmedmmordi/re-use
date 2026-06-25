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
    const target = user.role === "Admin" ? "/admin/dashboard" : redirectTo;
    return <Navigate to={target} replace />;
  }

  // Otherwise allow access
  return <Outlet />;
}
