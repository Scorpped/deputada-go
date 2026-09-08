import { useState } from "react";
import { Users, RefreshCw, AlertCircle, Copy, Check } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useLiderDashboard } from "@/hooks/useLiderDashboard";
import { Button } from "@/components/ui/button";

// ─── Referral link card ─────────────────────────────────────────────────────

function ReferralLinkCard({ link }: { link: string }) {
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
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="mb-3 text-sm font-medium text-muted-foreground">
        Seu link de indicação
      </p>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3">
        <span className="flex-1 truncate font-mono text-sm text-foreground" title={link}>
          {link}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="shrink-0 gap-1.5"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copiar
            </>
          )}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Compartilhe esse link — todo cadastro feito por ele conta como seu indicado.
      </p>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
      <div className="h-4 w-24 rounded bg-muted mb-4" />
      <div className="h-8 w-16 rounded bg-muted" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 animate-pulse">
      <div className="h-4 w-48 rounded bg-muted mb-6" />
      <div className="h-56 rounded bg-muted" />
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

function MetricCard({ label, value, icon }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold text-foreground">{value.toLocaleString("pt-BR")}</p>
      </div>
    </div>
  );
}

export default function LiderDashboard() {
  const { data, isLoading, error, refetch } = useLiderDashboard();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-base font-medium text-foreground">Não foi possível carregar o dashboard.</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={refetch} className="gap-2">
          <RefreshCw className="h-4 w-4" />Tentar novamente
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-foreground">Meu Dashboard</h1>
        <CardSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  const chartData = (data?.cadastros_por_dia ?? []).map((item) => ({
    data: item.data,
    quantidade: item.quantidade,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Meu Dashboard</h1>

      {data?.referral_link && <ReferralLinkCard link={data.referral_link} />}

      <MetricCard
        label="Total de Indicados"
        value={data?.total_indicados ?? 0}
        icon={<Users className="h-6 w-6 text-primary" />}
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <p className="mb-4 text-sm font-medium text-muted-foreground">
          Meus cadastros por dia — últimos 30 dias
        </p>
        {chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum cadastro registrado nos últimos 30 dias.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="data"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value: string) => {
                  const [, month, day] = value.split("-");
                  return `${day}/${month}`;
                }}
                interval="preserveStartEnd"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                formatter={(value: number) => [value, "Cadastros"]}
                labelFormatter={(label: string) => {
                  const [year, month, day] = label.split("-");
                  return `${day}/${month}/${year}`;
                }}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
