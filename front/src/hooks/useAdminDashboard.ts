import { useState, useEffect, useCallback } from "react";
import { getAdminDashboard, AdminDashboardResponse } from "../lib/api";

interface UseAdminDashboardResult {
  data: AdminDashboardResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAdminDashboard(): UseAdminDashboardResult {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminDashboard();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}
