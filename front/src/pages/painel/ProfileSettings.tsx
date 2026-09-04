import { AlertCircle, RefreshCw } from "lucide-react";
import { useProfileSettings } from "@/hooks/useProfileSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FormSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-pulse space-y-4">
      <div className="h-5 w-32 rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-4 w-16 rounded bg-muted" />
        <div className="h-9 w-full rounded bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-16 rounded bg-muted" />
        <div className="h-9 w-full rounded bg-muted" />
      </div>
      <div className="h-9 w-28 rounded bg-muted" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfileSettings() {
  const {
    isLoading,
    loadError,
    profileForm,
    setProfileForm,
    profileStatus,
    profileError,
    submitProfile,
    passwordForm,
    setPasswordForm,
    passwordStatus,
    passwordError,
    submitPassword,
  } = useProfileSettings();

  // ── Error state ──────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-base font-medium text-foreground">
          Não foi possível carregar os dados do perfil.
        </p>
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-foreground">
          Configurações de Perfil
        </h1>
        <FormSkeleton />
        <FormSkeleton />
      </div>
    );
  }

  // ── Main content ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">
        Configurações de Perfil
      </h1>

      {/* ── Dados Pessoais ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome</Label>
            <Input
              id="profile-name"
              type="text"
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, name: e.target.value })
              }
              disabled={profileStatus === "loading"}
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">E-mail</Label>
            <Input
              id="profile-email"
              type="email"
              value={profileForm.email}
              onChange={(e) =>
                setProfileForm({ ...profileForm, email: e.target.value })
              }
              disabled={profileStatus === "loading"}
              placeholder="seu@email.com"
            />
          </div>

          {profileStatus === "success" && (
            <p className="text-sm text-green-600">
              Dados pessoais atualizados com sucesso.
            </p>
          )}
          {profileStatus === "error" && profileError && (
            <p className="text-sm text-destructive">{profileError}</p>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={submitProfile}
            disabled={profileStatus === "loading"}
          >
            {profileStatus === "loading" ? "Salvando…" : "Salvar alterações"}
          </Button>
        </CardFooter>
      </Card>

      {/* ── Alterar Senha ──────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha atual</Label>
            <Input
              id="current-password"
              type="password"
              value={passwordForm.current_password}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  current_password: e.target.value,
                })
              }
              disabled={passwordStatus === "loading"}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input
              id="new-password"
              type="password"
              value={passwordForm.password}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, password: e.target.value })
              }
              disabled={passwordStatus === "loading"}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-confirmation">Confirmar nova senha</Label>
            <Input
              id="password-confirmation"
              type="password"
              value={passwordForm.password_confirmation}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  password_confirmation: e.target.value,
                })
              }
              disabled={passwordStatus === "loading"}
              placeholder="••••••••"
            />
          </div>

          {passwordStatus === "success" && (
            <p className="text-sm text-green-600">
              Senha alterada com sucesso.
            </p>
          )}
          {passwordStatus === "error" && passwordError && (
            <p className="text-sm text-destructive">{passwordError}</p>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={submitPassword}
            disabled={passwordStatus === "loading"}
          >
            {passwordStatus === "loading" ? "Salvando…" : "Alterar senha"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
