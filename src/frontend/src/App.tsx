import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { ChatProvider } from "./context/ChatContext";

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <ChatProvider>
          <RouterProvider router={router} />
        </ChatProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
