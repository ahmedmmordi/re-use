import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <h1 className="text-3xl font-bold">Home</h1>

      {isAuthenticated && user ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl">Hello, {user.email}</p>

          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="flex gap-4">
          <Link to="/login" className="px-6 py-2 bg-blue-500 text-white rounded-xl">
            Login
          </Link>

          <Link to="/signup" className="px-6 py-2 bg-green-500 text-white rounded-xl">
            Signup
          </Link>
        </div>
      )}
    </div>
  );
}
