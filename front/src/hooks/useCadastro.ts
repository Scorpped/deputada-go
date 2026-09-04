import { useMutation } from "@tanstack/react-query";
import { postCadastro } from "@/lib/api";

export function useCadastro() {
  return useMutation({
    mutationFn: postCadastro,
  });
}
