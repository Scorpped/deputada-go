import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { AuthUser } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  /** Roles allowed to access this route. If omitted, any authenticated user is allowed. */
  allowedRoles?: AuthUser["role"][];
}

const ROLE_HOME: Record<AuthUser["role"], string> = {
  admin: "/painel/admin",
  lider: "/painel/lider",
};

/**
 * Wraps a route to require authentication and optionally a specific role.
 * - Unauthenticated users are redirected to `/login`.
 * - Authenticated users with the wrong role are redirected to their own home.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // While the auth state is being resolved (e.g. fetching /me on mount), render nothing
  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  return <Outlet />;
}
