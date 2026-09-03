import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";
import type { JSX } from "react";

interface Props {
  children: JSX.Element;
}

const PrivateRoute = ({ children }: Props) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;