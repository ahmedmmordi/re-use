import { createBrowserRouter } from "react-router-dom";
import LoginPageWrapper from "./pages/LoginPageWrapper";
import SignUpPageWrapper from "./pages/SignUpPageWrapper";
import VerificationPageWrapper from "./pages/VerificationPageWrapper";
import ForgotPasswordPageWrapper from "./pages/ForgotPasswordPageWrapper";
import ResetPasswordVerificationPageWrapper from "./pages/ResetPasswordVerificationPageWrapper";
import ResetPasswordPageWrapper from "./pages/ResetPasswordPageWrapper";
import { GuestRoute } from "./components/GuestRoute";
// import LoginSuccess from "./pages/LoginSuccess";
import { ProtectedRoute } from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import CategoriesPageWrapper from "./pages/CategoriesPageWrapper";
import CategoryProductsPageWrapper from "./pages/CategoryProductsPageWrapper";
import ProductsPageWrapper from "./pages/ProductsPageWrapper";
import FollowersFollowingPageWrapper from "./pages/FollowersFollowingPageWrapper";
import CategoryManagementPageWrapper from "./pages/CategoryManagementPageWrapper";
import UnauthorizedPage from "./pages/UnauthorizedPage";

export const router = createBrowserRouter([
  //public
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/products",
    Component: ProductsPageWrapper,
  },
  {
    path: "/categories",
    Component: CategoriesPageWrapper,
  },
  {
    path: "/category/:categoryId",
    Component: CategoryProductsPageWrapper,
  },
  {
    path: "/unauthorized",
    Component: UnauthorizedPage,
  },
  // ❌ Only for NON-auth users
  {
    element: <GuestRoute />,
    children: [
      {
        path: "/login",
        Component: LoginPageWrapper,
      },
      {
        path: "/signup",
        Component: SignUpPageWrapper,
      },
      {
        path: "/verification",
        Component: VerificationPageWrapper,
      },
      {
        path: "/forgot-password",
        Component: ForgotPasswordPageWrapper,
      },
      {
        path: "/reset-password/verify",
        Component: ResetPasswordVerificationPageWrapper,
      },
      {
        path: "/reset-password",
        Component: ResetPasswordPageWrapper,
      },
    ],
  },
  // protected (admin)
  {
    element: <ProtectedRoute allowedRoles={["Admin"]} />,
    children: [
      {
        path: "/admin/categories",
        Component: CategoryManagementPageWrapper,
      },
    ],
  },
  // protected
  {
    element: <ProtectedRoute />,
    children: [
      {
        // path: "/login-success",
        // Component: LoginSuccess,
      },
      {
        path: "/followers-following",
        Component: FollowersFollowingPageWrapper,
      },
    ],
  },
]);
