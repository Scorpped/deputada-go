import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useIndicador } from "@/hooks/useIndicador";
import { useCadastro } from "@/hooks/useCadastro";
import { ValidationError } from "@/lib/api";

// ─── Dados da campanha ────────────────────────────────────────────────────────

const campanha = {
  nome: "Jandy Marcolino",
  cargo: "Deputada Estadual",
  partido: "Cidadania",
  numeroPartido: "23",
  numeroUrna: "23123",
  estado: "Goiás",
  instagram: "https://www.instagram.com/jandy_marcolino",
  chamadaHero:
    "Uma candidatura construída com quem vive Goiás todo dia. Deixe seu cadastro e caminhe junto.",
  bio: [
    "Este espaço recebe a biografia da candidata, escrita pela campanha.",
    "Conte a trajetória dela, de onde ela vem, o que já fez e por que decidiu se candidatar.",
  ],
  cnpj: "00.000.000/0001-00",
};

// ─── Zod schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  whatsapp: z.string().min(14, "WhatsApp inválido — informe DDD + número"),
  data_nascimento: z
    .string()
    .min(1, "Data de nascimento é obrigatória")
    .refine((v) => {
      if (v.length !== 10) return false;
      const [d, m, y] = v.split("/").map(Number);
      const date = new Date(y, m - 1, d);
      return (
        date.getFullYear() === y &&
        date.getMonth() === m - 1 &&
        date.getDate() === d
      );
    }, "Data inválida — use o formato DD/MM/AAAA"),
  endereco: z.string().min(1, "Endereço é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  email: z.string().email("E-mail inválido"),
  lgpd_aceito: z.boolean().refine((v) => v === true, "Aceite obrigatório"),
});

type FormValues = z.infer<typeof schema>;

// ─── Cities list ──────────────────────────────────────────────────────────────

const cidades = [
  "Águas Claras (RA-20)", "Águas Quentes (RA-35)", "Arapoanga (RA-34)", "Arniqueira (RA-33)",
  "Brasília (RA-01)", "Brazlândia (RA-04)", "Candangolândia (RA-19)", "Ceilândia (RA-09)",
  "Cruzeiro (RA-11)", "Fercal (RA-31)", "Gama (RA-02)", "Guará (RA-10)", "Itapoã (RA-28)",
  "Jardim Botânico (RA-27)", "Lago Norte (RA-18)", "Lago Sul (RA-16)",
  "Núcleo Bandeirante (RA-08)", "Paranoá (RA-07)", "Park Way (RA-24)", "Planaltina (RA-06)",
  "Recanto das Emas (RA-15)", "Riacho Fundo (RA-17)", "Riacho Fundo II (RA-21)",
  "Samambaia (RA-12)", "Santa Maria (RA-13)", "São Sebastião (RA-14)", "SCIA (RA-25)",
  "SIA (RA-29)", "Sobradinho (RA-05)", "Sobradinho II (RA-26)",
  "Sol Nascente/Pôr do Sol (RA-32)", "Sudoeste/Octogonal (RA-22)", "Taguatinga (RA-03)",
  "Varjão (RA-23)", "Vicente Pires (RA-30)", "Moro no Entorno",
];

// ─── Helpers visuais ──────────────────────────────────────────────────────────

/** Ícone de coração da marca — SVG inline para não depender de assets externos */
function Coracao({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

/** Cartão de foto com borda rosa e cantos arredondados */
function CartaoFoto({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="overflow-hidden rounded-[2rem] border-4 border-rosa bg-papel shadow-[0_24px_60px_-30px_rgba(58,15,71,0.5)]">
        <img src={src} alt={alt} className="block h-auto w-full" />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const Index = () => {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");

  const { data: indicadorData, isLoading: indicadorLoading } = useIndicador(refCode);
  const { mutateAsync, isPending } = useCadastro();

  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { lgpd_aceito: false },
  });

  const onSubmit = async (values: FormValues) => {
    const cleanWhatsapp = values.whatsapp.replace(/\D/g, "");
    const payload = {
      nome: values.nome,
      whatsapp: cleanWhatsapp,
      data_nascimento: (() => {
        const [d, m, y] = values.data_nascimento.split("/");
        return `${y}-${m}-${d}`;
      })(),
      endereco: values.endereco,
      cidade: values.cidade,
      email: values.email,
      lgpd_aceito: values.lgpd_aceito,
      ...(refCode ? { referral_code: refCode } : {}),
    };

    try {
      await mutateAsync(payload);
      setSubmitted(true);
      toast.success("Cadastro enviado com sucesso!");
    } catch (err) {
      if (err instanceof ValidationError) {
        for (const [field, messages] of Object.entries(err.errors)) {
          setError(field as keyof FormValues, {
            type: "server",
            message: messages[0],
          });
        }
      } else {
        const message =
          err instanceof Error
            ? err.message
            : "Ocorreu um erro ao enviar o cadastro. Tente novamente.";
        toast.error(message);
      }
    }
  };

  const indicador = indicadorData?.data ?? null;
  const showIndicador = !!refCode && (indicadorLoading || !!indicador);

  return (
    <main className="bg-papel font-body text-tinta">

      {/* ── 1. HERO: fundo azul chapado da marca ─────────────────────── */}
      <section className="relative overflow-hidden border-b-4 border-tinta bg-azul">
        {/* Link discreto para o painel */}
        <div className="container max-w-5xl relative px-6 pt-4 flex justify-end">
          <Link
            to="/login"
            className="text-xs text-tinta-suave hover:text-rosa transition-colors"
          >
            Acesso ao painel
          </Link>
        </div>

        <div className="mx-auto flex flex-col md:grid max-w-6xl items-center gap-10 px-6 pb-16 pt-10 md:grid-cols-[55fr_45fr] md:gap-10 md:pb-20 md:pt-16">
          {/* Logo + botão — mobile: order 1 (topo), desktop: esquerda */}
          <div className="faixa-monta w-full md:order-1">
            <h1 className="sr-only">
              {campanha.nome}, {campanha.cargo} por {campanha.estado},{" "}
              {campanha.partido} {campanha.numeroPartido}, número {campanha.numeroUrna}
            </h1>

            <img
              src="/logo.png"
              alt={`${campanha.nome} — ${campanha.cargo} ${campanha.numeroUrna}`}
              className="block w-full max-w-[28rem]"
            />

            {/* Chamada hero — só no desktop */}
            <p className="hidden md:block mt-6 max-w-[42ch] font-body text-lg leading-relaxed text-tinta">
              {campanha.chamadaHero}
            </p>

            <div className="mt-8 flex md:block">
              <a
                href="#cadastro"
                className="rounded-full bg-rosa px-8 py-3.5 font-display text-base font-semibold text-papel shadow-sm transition-colors hover:bg-rosa-claro mx-auto md:mx-0"
              >
                Quero apoiar
              </a>
            </div>
          </div>

          {/* Foto — mobile: order 2 (meio) */}
          <div className="relative w-full md:order-2">
            <CartaoFoto
              src="/jandy-azul.jpg"
              alt={`${campanha.nome}, candidata a ${campanha.cargo} por ${campanha.estado}`}
              className="relative mx-auto max-w-sm md:max-w-none"
            />
          </div>

          {/* Chamada hero — só no mobile, abaixo da foto */}
          <p className="block md:hidden w-full font-body text-lg leading-relaxed text-tinta">
            {campanha.chamadaHero}
          </p>
        </div>
      </section>

      {/* ── 2. QUEM É a candidata ────────────────────────────────────── */}
      <section className="bg-papel">
        <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 py-20 md:grid-cols-[1fr_320px] md:py-28">
          <div className="faixa-monta">
            <h2 className="font-display text-4xl font-extrabold tracking-tighter text-tinta md:text-5xl">
              Quem é a {campanha.nome.split(" ")[0]}
            </h2>
            {campanha.bio.map((paragrafo) => (
              <p
                key={paragrafo}
                className="mt-5 max-w-[60ch] font-body text-lg leading-relaxed text-tinta-suave"
              >
                {paragrafo}
              </p>
            ))}
          </div>

          <div className="relative mx-auto w-full max-w-[280px] md:max-w-none">
            {/* Link acima do dedo — desktop: flutua para a esquerda; mobile: acima à esquerda da seção */}
            <a
              href={campanha.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-2 -ml-8 md:absolute md:mb-0 md:-top-8 md:ml-0 md:text-left text-center font-display text-sm font-bold tracking-tight text-rosa underline underline-offset-4 hover:text-rosa-claro transition-colors"
              style={{left: '-124px'}}
            >
              Acompanhe no Instagram ↗
            </a>
            <CartaoFoto
              src="/jandy-rosa.jpg"
              alt={`${campanha.nome} em foto de campanha`}
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* ── 3. CADASTRO: fundo rosa-tenue no momento da conversão ──────── */}
      <section id="cadastro" className="bg-rosa-tenue">
        <div className="mx-auto max-w-2xl px-6 py-20 md:py-28">
          {/* Indicado por — só aparece quando ?ref= está na URL */}
          {showIndicador && (
            <div className="mb-8 rounded-2xl bg-papel border border-linha p-5 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-rosa-tenue flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-rosa" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-tinta-suave">Indicado por</p>
                {indicadorLoading ? (
                  <p className="font-semibold text-tinta animate-pulse">Carregando...</p>
                ) : indicador ? (
                  <p className="font-semibold text-tinta">{indicador.nome}</p>
                ) : null}
              </div>
            </div>
          )}

          <div className="text-center">
            <h2 className="font-display text-4xl font-extrabold tracking-tighter text-tinta md:text-5xl">
              Cadastro de apoio
            </h2>
            <p className="mx-auto mt-4 max-w-[50ch] font-body text-lg leading-relaxed text-tinta-suave">
              Deixe seus dados e a equipe da campanha entra em contato. Leva menos de um
              minuto.
            </p>
          </div>

          {/* Card do formulário */}
          <div className="mt-10 rounded-[2rem] border-4 border-tinta bg-papel shadow-[0_24px_60px_-30px_rgba(58,15,71,0.55)]">
            {submitted ? (
              <div className="p-8 text-center sm:p-12">
                <CheckCircle2 className="h-12 w-12 text-rosa mx-auto" />
                <h3 className="mt-5 font-display text-3xl font-extrabold tracking-tighter text-tinta">
                  Cadastro confirmado!
                </h3>
                <p className="mx-auto mt-3 max-w-[45ch] font-body text-base leading-relaxed text-tinta-suave">
                  Obrigada pelo apoio. A equipe da campanha vai falar com você pelos
                  contatos que você deixou.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="rounded-[2rem] p-6 sm:p-10"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Nome */}
                  <div className="sm:col-span-2">
                    <CampoRotulo htmlFor="nome">Nome Completo</CampoRotulo>
                    <CampoInput
                      id="nome"
                      type="text"
                      placeholder="Seu nome completo"
                      autoComplete="name"
                      {...register("nome")}
                    />
                    <CampoErro mensagem={errors.nome?.message} />
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <CampoRotulo htmlFor="whatsapp">WhatsApp</CampoRotulo>
                    <Controller
                      name="whatsapp"
                      control={control}
                      render={({ field }) => (
                        <CampoInput
                          id="whatsapp"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          placeholder="(61) 99999-9999"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                            let masked = digits;
                            if (digits.length > 2)
                              masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                            if (digits.length > 7)
                              masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                            field.onChange(masked);
                          }}
                        />
                      )}
                    />
                    <CampoErro mensagem={errors.whatsapp?.message} />
                  </div>

                  {/* Data de nascimento */}
                  <div>
                    <CampoRotulo htmlFor="data_nascimento">Data de Nascimento</CampoRotulo>
                    <Controller
                      name="data_nascimento"
                      control={control}
                      render={({ field }) => (
                        <CampoInput
                          id="data_nascimento"
                          type="text"
                          inputMode="numeric"
                          placeholder="DD/MM/AAAA"
                          maxLength={10}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                            let masked = digits;
                            if (digits.length > 2)
                              masked = `${digits.slice(0, 2)}/${digits.slice(2)}`;
                            if (digits.length > 4)
                              masked = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
                            field.onChange(masked);
                          }}
                        />
                      )}
                    />
                    <CampoErro mensagem={errors.data_nascimento?.message} />
                  </div>

                  {/* Endereço */}
                  <div className="sm:col-span-2">
                    <CampoRotulo htmlFor="endereco">Endereço</CampoRotulo>
                    <CampoInput
                      id="endereco"
                      type="text"
                      placeholder="Rua, quadra, conjunto, número"
                      {...register("endereco")}
                    />
                    <CampoErro mensagem={errors.endereco?.message} />
                  </div>

                  {/* Cidade */}
                  <div className="sm:col-span-2">
                    <CampoRotulo htmlFor="cidade">Cidade / RA</CampoRotulo>
                    <Controller
                      name="cidade"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <SelectTrigger
                            id="cidade"
                            className="h-12 w-full rounded-xl border-2 border-linha bg-papel px-4 font-body text-base text-tinta focus:border-rosa focus:ring-0"
                          >
                            <SelectValue placeholder="Selecione a cidade/RA" />
                          </SelectTrigger>
                          <SelectContent className="max-h-72">
                            {cidades.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <CampoErro mensagem={errors.cidade?.message} />
                  </div>

                  {/* Email */}
                  <div className="sm:col-span-2">
                    <CampoRotulo htmlFor="email">E-mail</CampoRotulo>
                    <CampoInput
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="voce@email.com"
                      {...register("email")}
                    />
                    <CampoErro mensagem={errors.email?.message} />
                  </div>
                </div>

                {/* LGPD — consentimento explícito, não pré-marcado */}
                <div className="mt-6">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-rosa-tenue bg-rosa-tenue/40 p-4">
                    <Controller
                      name="lgpd_aceito"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="lgpd"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-0.5 h-5 w-5 shrink-0 data-[state=checked]:bg-rosa data-[state=checked]:border-rosa"
                        />
                      )}
                    />
                    <Label
                      htmlFor="lgpd"
                      className="font-body text-sm leading-relaxed text-tinta cursor-pointer"
                    >
                      Concordo com os termos de uso e política de privacidade (LGPD).
                      Autorizo o armazenamento e uso dos meus dados para contato. *
                    </Label>
                  </label>
                  <CampoErro mensagem={errors.lgpd_aceito?.message} />
                </div>

                {/* Botão de envio */}
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-full bg-rosa px-8 py-4 font-display text-base font-semibold text-papel shadow-sm transition-colors hover:bg-rosa-claro disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? "Enviando..." : "Quero apoiar"}
                  </button>
                </div>

                <p className="mt-4 text-xs text-center text-tinta-suave">
                  Ao enviar, você concorda com nossos termos de uso e política de privacidade.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── 4. RODAPÉ ─────────────────────────────────────────────────── */}
      <footer className="border-t-4 border-tinta bg-tinta text-papel">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex items-center gap-3">
            <Coracao className="h-7 w-7 text-rosa" />
            <p className="font-display text-2xl font-extrabold tracking-tighter">
              {campanha.nome}
            </p>
          </div>

          <dl className="mt-8 divide-y divide-papel/15 border-y border-papel/15">
            <FooterRow label="Cargo" value={campanha.cargo} />
            <FooterRow label="Número na urna" value={campanha.numeroUrna} />
            <FooterRow
              label="Partido"
              value={`${campanha.partido} ${campanha.numeroPartido}`}
            />
            <FooterRow label="Estado" value={campanha.estado} />
            <div className="flex flex-wrap justify-between gap-2 py-3.5">
              <dt className="font-body text-sm text-papel/60">Instagram</dt>
              <dd className="font-display text-sm font-semibold">
                <a
                  href={campanha.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rosa underline underline-offset-4"
                >
                  jandy_marcolino
                </a>
              </dd>
            </div>
          </dl>

          <p className="mt-8 max-w-[70ch] font-body text-xs leading-relaxed text-papel/55">
            Propaganda eleitoral. Conteúdo de responsabilidade da campanha de{" "}
            {campanha.nome}, {campanha.partido} {campanha.numeroPartido},{" "}
            {campanha.estado}.
          </p>
        </div>
      </footer>
    </main>
  );
};

// ─── Micro-componentes do formulário ─────────────────────────────────────────

const campoBase =
  "w-full rounded-xl border-2 border-linha bg-papel px-4 py-3.5 font-body text-base text-tinta placeholder:text-tinta-suave/60 transition-colors focus:border-rosa focus:outline-none";

function CampoRotulo({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block font-display text-sm font-semibold tracking-tight text-tinta"
    >
      {children}
    </label>
  );
}

const CampoInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => <input ref={ref} className={campoBase} {...props} />);
CampoInput.displayName = "CampoInput";

function CampoErro({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <p role="alert" className="mt-1.5 font-body text-sm font-medium text-destructive">
      {mensagem}
    </p>
  );
}

function FooterRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 py-3.5">
      <dt className="font-body text-sm text-papel/60">{label}</dt>
      <dd className="font-display text-sm font-semibold">{value}</dd>
    </div>
  );
}

export default Index;
