import { useState } from "react";
import {
  Plus,
  Pencil,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  KeyRound,
} from "lucide-react";
import { useLideres } from "@/hooks/useLideres";
import {
  createLider,
  updateLider,
  toggleLider,
  resetLiderPassword,
  ValidationError,
  type Lider,
  type CreateLiderPayload,
  type UpdateLiderPayload,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalMode = "create" | "edit";

interface ModalState {
  open: boolean;
  mode: ModalMode;
  lider: Lider | null;
}

// ─── Table skeleton ───────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-56" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-10" /></TableCell>
          <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

// ─── Referral link display with copy button ───────────────────────────────────

function ReferralLinkCell({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="flex items-center gap-1 max-w-xs">
      <span className="truncate text-xs text-muted-foreground font-mono" title={link}>
        {link}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Copiar link"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

// ─── Lider modal (create / edit) ──────────────────────────────────────────────

interface LiderModalProps {
  open: boolean;
  mode: ModalMode;
  lider: Lider | null;
  onClose: () => void;
  onSuccess: (lider: Lider) => void;
}

function LiderModal({ open, mode, lider, onClose, onSuccess }: LiderModalProps) {
  const [name, setName] = useState(lider?.name ?? "");
  const [email, setEmail] = useState(lider?.email ?? "");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Reset form when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  // Sync form fields when lider prop changes (edit mode)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);
    setIsSubmitting(true);

    try {
      let result: Lider;
      if (mode === "create") {
        const payload: CreateLiderPayload = { name, email, password };
        result = await createLider(payload);
      } else {
        const payload: UpdateLiderPayload = { name, email };
        result = await updateLider(lider!.id, payload);
      }
      onSuccess(result);
    } catch (err) {
      if (err instanceof ValidationError) {
        setFieldErrors(err.errors);
      } else {
        setGeneralError(
          err instanceof Error ? err.message : "Ocorreu um erro. Tente novamente."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = mode === "create" ? "Novo Líder" : "Editar Líder";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="lider-name">Nome</Label>
            <Input
              id="lider-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              disabled={isSubmitting}
              aria-describedby={fieldErrors.name ? "lider-name-error" : undefined}
            />
            {fieldErrors.name && (
              <p id="lider-name-error" className="text-xs text-destructive">
                {fieldErrors.name[0]}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="lider-email">Email</Label>
            <Input
              id="lider-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              disabled={isSubmitting}
              aria-describedby={fieldErrors.email ? "lider-email-error" : undefined}
            />
            {fieldErrors.email && (
              <p id="lider-email-error" className="text-xs text-destructive">
                {fieldErrors.email[0]}
              </p>
            )}
          </div>

          {/* Password — only on create */}
          {mode === "create" && (
            <div className="space-y-1">
              <Label htmlFor="lider-password">Senha</Label>
              <Input
                id="lider-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                disabled={isSubmitting}
                aria-describedby={fieldErrors.password ? "lider-password-error" : undefined}
              />
              {fieldErrors.password && (
                <p id="lider-password-error" className="text-xs text-destructive">
                  {fieldErrors.password[0]}
                </p>
              )}
            </div>
          )}

          {/* General error */}
          {generalError && (
            <p className="text-sm text-destructive">{generalError}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : mode === "create" ? (
                "Criar"
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Referral link success banner ─────────────────────────────────────────────

interface ReferralBannerProps {
  lider: Lider;
  onDismiss: () => void;
}

function ReferralBanner({ lider, onDismiss }: ReferralBannerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lider.referral_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 flex items-start justify-between gap-4">
      <div className="space-y-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          Líder <strong>{lider.name}</strong> criado com sucesso!
        </p>
        <p className="text-xs text-muted-foreground">Link de indicação:</p>
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono text-primary break-all">
            {lider.referral_link}
          </code>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="shrink-0 text-primary hover:text-primary/80 transition-colors"
            aria-label="Copiar link de indicação"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-primary hover:text-primary/80 text-lg leading-none"
        aria-label="Fechar"
      >
        ×
      </button>
    </div>
  );
}

// ─── Reset password modal ─────────────────────────────────────────────────────

interface ResetPasswordModalProps {
  open: boolean;
  lider: Lider | null;
  onClose: () => void;
  onSuccess: () => void;
}

function ResetPasswordModal({ open, lider, onClose, onSuccess }: ResetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setIsSubmitting(true);
    try {
      await resetLiderPassword(lider!.id, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Redefinir senha — {lider?.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirm-password">Confirmar senha</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a senha"
              disabled={isSubmitting}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminLideres() {
  const { data, isLoading, error, page, setPage, refetch } = useLideres();

  const [modal, setModal] = useState<ModalState>({
    open: false,
    mode: "create",
    lider: null,
  });

  const [newlyCreated, setNewlyCreated] = useState<Lider | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [resetTarget, setResetTarget] = useState<Lider | null>(null);

  // ── Modal helpers ────────────────────────────────────────────────────────────

  const openCreate = () => {
    setModal({ open: true, mode: "create", lider: null });
  };

  const openEdit = (lider: Lider) => {
    setModal({ open: true, mode: "edit", lider });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, open: false }));
  };

  const handleModalSuccess = (lider: Lider) => {
    closeModal();
    refetch();
    if (modal.mode === "create") {
      setNewlyCreated(lider);
    }
  };

  // ── Toggle ───────────────────────────────────────────────────────────────────

  const handleToggle = async (id: number) => {
    setTogglingId(id);
    try {
      await toggleLider(id);
      refetch();
    } catch {
      // silently ignore — user can retry via refetch
    } finally {
      setTogglingId(null);
    }
  };

  // ── Error state ──────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-base font-medium text-foreground">
          Não foi possível carregar os líderes.
        </p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={refetch} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  const lideres = data?.data ?? [];
  const lastPage = data?.last_page ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">Líderes</h1>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Líder</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {/* Referral link banner after creation */}
      {newlyCreated && (
        <ReferralBanner
          lider={newlyCreated}
          onDismiss={() => setNewlyCreated(null)}
        />
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Nome</TableHead>
                <TableHead className="whitespace-nowrap">Email</TableHead>
                <TableHead className="whitespace-nowrap">Link de Indicação</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right whitespace-nowrap">Indicados</TableHead>
                <TableHead className="text-right whitespace-nowrap">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : lideres.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    Nenhum líder cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                lideres.map((lider) => (
                  <TableRow key={lider.id}>
                    <TableCell className="font-medium text-foreground whitespace-nowrap">
                      {lider.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{lider.email}</TableCell>
                    <TableCell>
                      <ReferralLinkCell link={lider.referral_link} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={lider.active ? "default" : "secondary"}
                        className={
                          lider.active
                            ? "bg-primary/20 text-primary hover:bg-primary/20"
                            : "bg-muted text-muted-foreground hover:bg-muted"
                        }
                      >
                        {lider.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-foreground whitespace-nowrap">
                      {lider.total_indicados.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-3">
                        {/* Edit button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(lider)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          aria-label={`Editar ${lider.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* Reset password button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setResetTarget(lider)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          aria-label={`Redefinir senha de ${lider.name}`}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>

                        {/* Activate / deactivate toggle */}
                        <Switch
                          checked={lider.active}
                          onCheckedChange={() => void handleToggle(lider.id)}
                          disabled={togglingId === lider.id}
                          aria-label={
                            lider.active
                              ? `Desativar ${lider.name}`
                              : `Ativar ${lider.name}`
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
          <span>
            Total: <strong className="text-foreground">{total.toLocaleString("pt-BR")}</strong> líder
            {total !== 1 ? "es" : ""}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1 || isLoading}
              className="h-8 w-8 p-0"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">
              {page} / {lastPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= lastPage || isLoading}
              className="h-8 w-8 p-0"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {modal.open && (
        <LiderModal
          open={modal.open}
          mode={modal.mode}
          lider={modal.lider}
          onClose={closeModal}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Reset password modal */}
      <ResetPasswordModal
        open={!!resetTarget}
        lider={resetTarget}
        onClose={() => setResetTarget(null)}
        onSuccess={() => setResetTarget(null)}
      />
    </div>
  );
}
