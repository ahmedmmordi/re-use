import { useState } from "react";
import { Menu, X, UserPlus, LogIn } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { useNavigate } from "react-router-dom";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // Handle search logic here
  };

  return (
    <>
      <nav className="bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] w-full px-4 sm:px-6 md:px-8 py-4 md:py-6">
        <div className="flex items-center justify-between h-full max-w-[1600px] mx-auto gap-2 sm:gap-4 md:gap-8">
          {/* Logo */}
          <h1
            className="text-white text-[24px] sm:text-[28px] md:text-[36px] font-normal italic flex-shrink-0 cursor-pointer"
            style={{ fontFamily: "'Pacifico', cursive" }}
            onClick={() => navigate("/")}
          >
            ReUse
          </h1>

          {/* Search Bar - Hidden on mobile, shown from md up */}
          <div className="hidden md:block flex-1">
            <SearchBar onSearch={handleSearch} />
          </div>

          <div className="hidden md:flex items-center gap-3 lg:gap-6 flex-shrink-0">
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 text-white text-[13px] lg:text-[15px] font-medium px-3 lg:px-5 py-2 lg:py-2.5 rounded-lg hover:bg-white/10 transition-all duration-200"
            >
              <LogIn size={16} />
              Log in
            </button>
            {/* Divider */}
            <div className="h-8 w-px bg-white/20"></div>
            <button
              onClick={() => navigate("/signup")}
              className="flex items-center gap-2 text-white text-[13px] lg:text-[15px] font-medium px-3 lg:px-5 py-2 lg:py-2.5 rounded-lg hover:bg-white/10 transition-all duration-200"
            >
              <UserPlus size={16} />
              Sign up
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Search Bar - Shown only on mobile */}
        <div className="md:hidden mt-4">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/20 pt-4 space-y-3">
            <button
              onClick={() => {
                navigate("/signup");
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-white text-[15px] font-medium px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-left"
            >
              Sign up
            </button>
            <button
              onClick={() => {
                navigate("/login");
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-white text-[15px] font-medium px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 text-left"
            >
              Log in
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
