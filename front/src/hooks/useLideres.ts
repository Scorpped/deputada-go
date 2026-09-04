import { useState, useEffect, useCallback } from "react";
import { getLideres, Lider, PaginatedResponse } from "../lib/api";

interface UseLideresResult {
  data: PaginatedResponse<Lider> | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  setPage: (page: number) => void;
  refetch: () => void;
}

export function useLideres(perPage = 15): UseLideresResult {
  const [data, setData] = useState<PaginatedResponse<Lider> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getLideres({ page, per_page: perPage });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar líderes.");
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, page, setPage, refetch: fetch };
}
