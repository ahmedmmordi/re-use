import { createBrowserRouter } from "react-router-dom";
import LoginPageWrapper from "./pages/LoginPageWrapper";
import SignUpPageWrapper from "./pages/SignUpPageWrapper";
import VerificationPageWrapper from "./pages/VerificationPageWrapper";
import { GuestRoute } from "./components/GuestRoute";
// import LoginSuccess from "./pages/LoginSuccess";
// import { ProtectedRoute } from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";

export const router = createBrowserRouter([
  //public
  {
    path: "/",
    Component: HomePage,
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
    ],
  },
  // protected
  // {
  //   element: <ProtectedRoute />,
  //   children: [
  //     {
  //       path: "/login-success",
  //       Component: LoginSuccess,
  //     },
  //   ],
  // },
]);
