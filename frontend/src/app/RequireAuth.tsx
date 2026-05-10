import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useSession } from "./SessionContext";

export function RequireAuth(): JSX.Element {
  const { session } = useSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
