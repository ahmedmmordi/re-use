import { useAuth } from "../context/AuthContext";
import { CategoryBar } from "../components/CategoryBar";
import { PublicUserProfilePage } from "../components/PublicUserProfilePage";
import { Navbar } from "../components/Navbar";
import { AdminNavbar } from "../components/AdminNavbar";
import { LoggedInNavbar } from "../components/LoggedInNavbar";

export default function PublicUserProfilePageWrapper() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      {user?.role === "Admin" ? <AdminNavbar /> : user ? <LoggedInNavbar /> : <Navbar />}
      <CategoryBar />
      <div className="flex-1">
        <PublicUserProfilePage />
      </div>
    </div>
  );
}
