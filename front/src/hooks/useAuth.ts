import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import type { AuthContextValue } from "@/contexts/AuthContext";

/**
 * Returns the authentication context.
 * Must be used inside an `AuthProvider`.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
