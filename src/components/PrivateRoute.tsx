import { Navigate } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import type { JSX } from "react";

interface Props {
  children: JSX.Element;
}

const PrivateRoute = ({ children }: Props) => {
  const { isAuthenticated, initializing  } = useAuth();

  if (initializing) return null;

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;