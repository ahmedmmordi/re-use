import { useAuth } from "../context/AuthContext";
import { LoggedInNavbar } from "../components/LoggedInNavbar";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { CategoryBar } from "../components/CategoryBar.tsx";
import { AdminNavbar } from "../components/AdminNavbar.tsx";
import { HeroSection } from "../components/HeroSection.tsx";

export default function HomePage() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {user?.role === "Admin" ? <AdminNavbar /> : user ? <LoggedInNavbar /> : <Navbar />}
      <CategoryBar />
      <HeroSection />
      <div className="flex-1 flex items-center justify-center">
        <h1 className="text-3xl font-bold">Home</h1>
      </div>
      <Footer />
    </div>
  );
}
