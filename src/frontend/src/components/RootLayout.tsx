import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AssistantWidget } from "./AssistantWidget";

export function RootLayout() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const isChatPage = location.pathname.startsWith("/chat");
  const isAdmin = user?.role === "Admin";
  const showAssistant = isAuthenticated && !isAdmin && !isChatPage;

  return (
    <>
      <ScrollRestoration />
      <Outlet />
      {showAssistant && <AssistantWidget />}
    </>
  );
}
