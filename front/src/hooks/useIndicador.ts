import { useQuery } from "@tanstack/react-query";
import { getIndicador } from "@/lib/api";

export function useIndicador(referralCode: string | null) {
  return useQuery({
    queryKey: ["indicador", referralCode],
    queryFn: () => getIndicador(referralCode!),
    enabled: !!referralCode,
    retry: false,
  });
}
