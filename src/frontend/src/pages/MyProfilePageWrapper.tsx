import { useAuth } from "../context/AuthContext";
import { CategoryBar } from "../components/CategoryBar";
import { MyProfilePage } from "../components/MyProfilePage";
import { LoggedInNavbar } from "../components/LoggedInNavbar";
import { AdminNavbar } from "../components/AdminNavbar";
import { Footer } from "../components/Footer";

export default function MyProfilePageWrapper() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      {user?.role === "Admin" ? <AdminNavbar /> : <LoggedInNavbar />}
      <CategoryBar />
      <div className="flex-1">
        <MyProfilePage />
      </div>
      <Footer />
    </div>
  );
}
