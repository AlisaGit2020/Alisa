import { Navigate } from "react-router-dom";
import useIsAuthenticated from "react-auth-kit/hooks/useIsAuthenticated";
import LandingPage from "./LandingPage";

export default function LandingPageRouter() {
  const isAuthenticated = useIsAuthenticated();

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <LandingPage />;
}
