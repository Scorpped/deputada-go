import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  email: z.string().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type FormValues = z.infer<typeof schema>;

// ─── Estilos de campo (mesma convenção do form-apoiador do politico) ──────────

const campoBase =
  "w-full rounded-xl border-2 border-linha bg-papel px-4 py-3.5 font-body text-base text-tinta placeholder:text-tinta-suave/60 transition-colors focus:border-rosa focus:outline-none";

// ─── Component ────────────────────────────────────────────────────────────────

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      navigate("/painel");
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Ocorreu um erro. Tente novamente.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-azul-fundo font-body text-tinta flex flex-col items-center justify-center px-4">

      {/* Marca no topo */}
      <Link
        to="/"
        className="mb-8 font-display text-2xl font-extrabold tracking-tighter text-tinta hover:text-rosa transition-colors"
      >
        Jandy Marcolino
      </Link>

      {/* Card do formulário */}
      <div className="w-full max-w-md rounded-[2rem] border-4 border-tinta bg-papel shadow-[0_24px_60px_-30px_rgba(58,15,71,0.4)] p-8 sm:p-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tighter text-tinta text-center">
          Acesso ao painel
        </h1>
        <p className="mt-2 text-center font-body text-sm text-tinta-suave">
          Use as credenciais enviadas pela campanha.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-5" noValidate>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block font-display text-sm font-semibold tracking-tight text-tinta"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              className={campoBase}
              {...register("email")}
            />
            {errors.email && (
              <p role="alert" className="mt-1.5 font-body text-sm font-medium text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block font-display text-sm font-semibold tracking-tight text-tinta"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={campoBase}
              {...register("password")}
            />
            {errors.password && (
              <p role="alert" className="mt-1.5 font-body text-sm font-medium text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-full bg-rosa px-8 py-4 font-display text-base font-semibold text-papel shadow-sm transition-colors hover:bg-rosa-claro disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>

          {/* Erro do servidor */}
          {serverError && (
            <p
              role="alert"
              className="rounded-xl bg-destructive/10 px-4 py-3 font-body text-sm font-medium text-destructive text-center"
            >
              {serverError}
            </p>
          )}
        </form>
      </div>

      {/* Voltar ao site */}
      <Link
        to="/"
        className="mt-6 font-body text-sm text-tinta-suave hover:text-rosa transition-colors"
      >
        ← Voltar ao site
      </Link>
    </div>
  );
};

export default Login;
