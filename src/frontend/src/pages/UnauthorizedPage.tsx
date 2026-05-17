import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-md w-full bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access denied</h1>
        <p className="text-gray-600 mb-6">
          You don&apos;t have permission to view this page. If you believe this is a mistake, sign
          in with an account that has the required role.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#3d2e7c] to-[#4a3689] text-white text-sm font-medium rounded-lg hover:shadow-md transition-all hover:scale-105 duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
