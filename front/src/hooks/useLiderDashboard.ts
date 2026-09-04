import { useState, useEffect, useCallback } from "react";
import { getLiderDashboard, LiderDashboardResponse } from "../lib/api";

interface UseLiderDashboardResult {
  data: LiderDashboardResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLiderDashboard(): UseLiderDashboardResult {
  const [data, setData] = useState<LiderDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getLiderDashboard();
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
