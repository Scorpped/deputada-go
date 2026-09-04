import { useState, useEffect, useCallback } from "react";
import { getApoiadores, Apoiador, PaginatedResponse } from "../lib/api";

interface UseApoiadoresResult {
  data: PaginatedResponse<Apoiador> | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  setPage: (page: number) => void;
  search: string;
  setSearch: (search: string) => void;
  refetch: () => void;
}

export function useApoiadores(perPage = 15): UseApoiadoresResult {
  const [data, setData] = useState<PaginatedResponse<Apoiador> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  // Reset to page 1 when search changes
  const handleSetSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getApoiadores({ page, per_page: perPage, search });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar apoiadores.");
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, search]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, page, setPage, search, setSearch: handleSetSearch, refetch: fetch };
}
