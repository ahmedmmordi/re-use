import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout } from "./components/RootLayout";
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
import EditProductPageWrapper from "./pages/EditProductPageWrapper";
import ProductManagementPageWrapper from "./pages/ProductManagementPageWrapper";
import AccountSettingsPageWrapper from "./pages/AccountSettingsPageWrapper";
import UserManagementPageWrapper from "./pages/UserManagementPageWrapper";
import AdminPaymentsPageWrapper from "./pages/AdminPaymentsPageWrapper";
import NotFoundPage from "./pages/NotFoundPage";
import GlobalErrorPage from "./pages/GlobalErrorPage";
import LegalPage from "./pages/LegalPage";
import SearchRedirectPage from "./pages/SearchRedirectPage";
import ActivityHistoryPageWrapper from "./pages/ActivityHistoryPageWrapper";
import HowItWorksPageWrapper from "./pages/HowItWorksPageWrapper";

import MyProductsPageWrapper from "./pages/MyProductsPageWrapper";
import ProductDetailsPageWrapper from "./pages/ProductDetailsPageWrapper";
import NotificationBroadcastPageWrapper from "./pages/NotificationBroadcastPageWrapper";
import LogsAuditPageWrapper from "./pages/LogsAuditPageWrapper";
import ChatPageWrapper from "./pages/ChatPageWrapper";
import AdminReportsPageWrapper from "./pages/AdminReportsPageWrapper";
import AdminDashboardPageWrapper from "./pages/AdminDashboardPageWrapper";

const routeErrorElement = <GlobalErrorPage />;

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      // Public
      {
        path: "/",
        Component: HomePage,
        errorElement: routeErrorElement,
      },
      {
        path: "/products",
        Component: ProductsPageWrapper,
        errorElement: routeErrorElement,
      },
      {
        path: "/search",
        Component: SearchRedirectPage,
        errorElement: routeErrorElement,
      },
      {
        path: "/product/:productId",
        Component: ProductDetailsPageWrapper,
        errorElement: routeErrorElement,
      },
      {
        path: "/categories",
        Component: CategoriesPageWrapper,
        errorElement: routeErrorElement,
      },
      {
        path: "/category/:categoryId",
        Component: CategoryProductsPageWrapper,
        errorElement: routeErrorElement,
      },
      {
        path: "/unauthorized",
        Component: UnauthorizedPage,
        errorElement: routeErrorElement,
      },
      {
        path: "/profile/:userId",
        Component: PublicUserProfilePageWrapper,
        errorElement: routeErrorElement,
      },
      {
        path: "/error",
        Component: GlobalErrorPage,
      },
      {
        path: "/legal",
        Component: LegalPage,
        errorElement: routeErrorElement,
      },
      {
        path: "/how-it-works",
        Component: HowItWorksPageWrapper,
        errorElement: routeErrorElement,
      },
      {
        path: "/terms",
        element: <Navigate to="/legal?tab=terms" replace />,
      },
      {
        path: "/privacy",
        element: <Navigate to="/legal?tab=privacy" replace />,
      },
      // Only for NON-auth users
      {
        element: <GuestRoute />,
        errorElement: routeErrorElement,
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
        errorElement: routeErrorElement,
        children: [
          {
            path: "/admin",
            element: <Navigate to="/admin/dashboard" replace />,
          },
          {
            path: "/admin/dashboard",
            Component: AdminDashboardPageWrapper,
          },
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
          {
            path: "/admin/settings",
            element: <Navigate to="/account-settings" replace />,
          },
          {
            path: "/admin/payments",
            Component: AdminPaymentsPageWrapper,
          },
          {
            path: "/admin/reports",
            Component: AdminReportsPageWrapper,
          },
          {
            path: "/admin/broadcast",
            Component: NotificationBroadcastPageWrapper,
          },
          {
            path: "/admin/logs",
            Component: LogsAuditPageWrapper,
          },
        ],
      },
      // Protected
      {
        element: <ProtectedRoute />,
        errorElement: routeErrorElement,
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
            path: "/product/:productId/edit",
            Component: EditProductPageWrapper,
          },
          {
            path: "/account-settings",
            Component: AccountSettingsPageWrapper,
          },
          {
            path: "/my-products",
            Component: MyProductsPageWrapper,
          },
          {
            path: "/activity-history",
            Component: ActivityHistoryPageWrapper,
          },
          {
            path: "/chat",
            Component: ChatPageWrapper,
          },
          {
            path: "/chat/:conversationId",
            Component: ChatPageWrapper,
          },
        ],
      },
      {
        path: "*",
        Component: NotFoundPage,
      },
    ],
  },
]);
