import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPageWrapper from "./pages/LoginPageWrapper";
import SignUpPageWrapper from "./pages/SignUpPageWrapper";
import VerificationPageWrapper from "./pages/VerificationPageWrapper";
import ForgotPasswordPageWrapper from "./pages/ForgotPasswordPageWrapper";
import ResetPasswordVerificationPageWrapper from "./pages/ResetPasswordVerificationPageWrapper";
import ResetPasswordPageWrapper from "./pages/ResetPasswordPageWrapper";
import { GuestRoute } from "./components/GuestRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import CategoriesPageWrapper from "./pages/CategoriesPageWrapper";
import CategoryProductsPageWrapper from "./pages/CategoryProductsPageWrapper";
import ProductsPageWrapper from "./pages/ProductsPageWrapper";
import FollowersFollowingPageWrapper from "./pages/FollowersFollowingPageWrapper";
import CategoryManagementPageWrapper from "./pages/CategoryManagementPageWrapper";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import FavoritesPageWrapper from "./pages/FavoritesPageWrapper";
import MyProfilePageWrapper from "./pages/MyProfilePageWrapper";
import PublicUserProfilePageWrapper from "./pages/PublicUserProfilePageWrapper";
import CreateProductPageWrapper from "./pages/CreateProductPageWrapper";
import ProductManagementPageWrapper from "./pages/ProductManagementPageWrapper";
import AccountSettingsPageWrapper from "./pages/AccountSettingsPageWrapper";
import UserManagementPageWrapper from "./pages/UserManagementPageWrapper";
import MyProductsPageWrapper from "./pages/MyProductsPageWrapper";

export const router = createBrowserRouter([
  // Public
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
  {
    path: "/profile/:userId",
    Component: PublicUserProfilePageWrapper,
  },
  // Only for NON-auth users
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
  // Protected (admin)
  {
    element: <ProtectedRoute allowedRoles={["Admin"]} />,
    children: [
      {
        path: "/admin/categories",
        Component: CategoryManagementPageWrapper,
      },
      {
        path: "/admin/products",
        Component: ProductManagementPageWrapper,
      },
      {
        path: "/admin/users",
        Component: UserManagementPageWrapper,
      },
    ],
  },
  // Protected
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/followers-following",
        Component: FollowersFollowingPageWrapper,
      },
      {
        path: "/favorites",
        Component: FavoritesPageWrapper,
      },
      {
        path: "/my-profile",
        Component: MyProfilePageWrapper,
      },
      {
        path: "/create-product",
        Component: CreateProductPageWrapper,
      },
      {
        path: "/account-settings",
        Component: AccountSettingsPageWrapper,
      },
      {
        path: "/admin/settings",
        element: <Navigate to="/account-settings" replace />,
      },
      {
        path: "/my-products",
        Component: MyProductsPageWrapper,
      },
    ],
  },
]);
