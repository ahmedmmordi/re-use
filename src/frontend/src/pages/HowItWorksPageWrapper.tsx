import { useAuth } from "../context/AuthContext";
import { LoggedInNavbar } from "../components/LoggedInNavbar";
import { Navbar } from "../components/Navbar";
import { AdminNavbar } from "../components/AdminNavbar.tsx";
import { Footer } from "../components/Footer";
import { HowItWorksPage } from "../components/HowItWorksPage";
import { CategoryBar } from "../components/CategoryBar";

export default function HowItWorksPageWrapper() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      {user?.role === "Admin" ? <AdminNavbar /> : user ? <LoggedInNavbar /> : <Navbar />}
      <CategoryBar />
      <div className="flex-1">
        <HowItWorksPage />
      </div>
      <Footer />
    </div>
  );
}
