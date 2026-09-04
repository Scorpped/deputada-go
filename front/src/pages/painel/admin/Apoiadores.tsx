import { useState, useEffect } from "react";
import { Search, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useApoiadores } from "@/hooks/useApoiadores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

export default function AdminApoiadores() {
  const { data, isLoading, error, page, setPage, setSearch, refetch } = useApoiadores();
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput, setSearch]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-base font-medium text-foreground">Não foi possível carregar os apoiadores.</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={refetch} className="gap-2">
          <RefreshCw className="h-4 w-4" />Tentar novamente
        </Button>
      </div>
    );
  }

  const apoiadores = data?.data ?? [];
  const lastPage = data?.last_page ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Apoiadores</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por nome, email ou cidade…"
          className="pl-9"
          aria-label="Buscar apoiadores"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Nome</TableHead>
                <TableHead className="whitespace-nowrap">Email</TableHead>
                <TableHead className="whitespace-nowrap">WhatsApp</TableHead>
                <TableHead className="whitespace-nowrap">Cidade</TableHead>
                <TableHead className="whitespace-nowrap">Nascimento</TableHead>
                <TableHead className="whitespace-nowrap">Indicador</TableHead>
                <TableHead className="whitespace-nowrap">Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : apoiadores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    Nenhum apoiador encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                apoiadores.map((apoiador) => (
                  <TableRow key={apoiador.id}>
                    <TableCell className="font-medium text-foreground whitespace-nowrap">{apoiador.nome}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{apoiador.email}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{apoiador.whatsapp}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{apoiador.cidade}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(apoiador.data_nascimento)}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{apoiador.nome_indicador ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(apoiador.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {!isLoading && total > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
          <span>
            Total: <strong className="text-foreground">{total.toLocaleString("pt-BR")}</strong> apoiador{total !== 1 ? "es" : ""}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1 || isLoading} className="h-8 w-8 p-0" aria-label="Página anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">{page} / {lastPage}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= lastPage || isLoading} className="h-8 w-8 p-0" aria-label="Próxima página">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
