import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { ChatUnreadProvider } from "./context/ChatUnreadContext";

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <ChatUnreadProvider>
          <RouterProvider router={router} />
        </ChatUnreadProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
