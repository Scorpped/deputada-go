import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function PainelIndex() {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return <Navigate to="/painel/admin" replace />;
  }

  if (user?.role === "lider") {
    return <Navigate to="/painel/lider" replace />;
  }

  // Fallback while user is loading or role is unknown
  return null;
}
