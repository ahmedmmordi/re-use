import { createBrowserRouter } from "react-router-dom";
import LoginPageWrapper from "./pages/LoginPageWrapper";
import LoginSuccess from "./pages/LoginSuccess"
import {ProtectedRoute} from "./components/ProtectedRoute"

export const router = createBrowserRouter([
  //public
  {
    path: "/login",
    Component: LoginPageWrapper,
  },
  // protected
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/login-success",
        Component: LoginSuccess,
      }
    ]
  }
]);