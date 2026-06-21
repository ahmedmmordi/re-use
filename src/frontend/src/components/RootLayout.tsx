import { Outlet, ScrollRestoration } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AssistantWidget } from "./AssistantWidget";

export function RootLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <ScrollRestoration />
      <Outlet />
      {isAuthenticated && <AssistantWidget />}
    </>
  );
}
