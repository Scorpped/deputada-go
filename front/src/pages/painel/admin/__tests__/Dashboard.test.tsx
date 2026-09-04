import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AdminDashboard from "@/pages/painel/admin/Dashboard";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUseAdminDashboard = vi.fn();

vi.mock("@/hooks/useAdminDashboard", () => ({
  useAdminDashboard: () => mockUseAdminDashboard(),
}));

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AdminDashboard — testes de componente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 4.3 — Exibição de skeleton durante loading ────────────────────────────
  it("exibe skeletons com animate-pulse durante o carregamento", () => {
    mockUseAdminDashboard.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    const { container } = render(<AdminDashboard />);

    // CardSkeleton and ChartSkeleton both have animate-pulse class
    const pulsingElements = container.querySelectorAll(".animate-pulse");
    expect(pulsingElements.length).toBeGreaterThan(0);
  });

  // ── 4.4 — Exibição de cards com dados ────────────────────────────────────
  it("exibe cards de métricas com os dados corretos", () => {
    mockUseAdminDashboard.mockReturnValue({
      data: {
        total_apoiadores: 1234,
        total_lideres: 56,
        cadastros_por_dia: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AdminDashboard />);

    expect(screen.getByText("Total de Apoiadores")).toBeInTheDocument();
    expect(screen.getByText("Total de Líderes")).toBeInTheDocument();
    // Numbers formatted with pt-BR locale
    expect(screen.getByText("1.234")).toBeInTheDocument();
    expect(screen.getByText("56")).toBeInTheDocument();
  });

  // ── 4.5 — Exibição de erro com botão de retry ─────────────────────────────
  it("exibe mensagem de erro e botão 'Tentar novamente' quando há erro", () => {
    mockUseAdminDashboard.mockReturnValue({
      data: null,
      isLoading: false,
      error: "Erro de conexão",
      refetch: vi.fn(),
    });

    render(<AdminDashboard />);

    expect(screen.getByText("Não foi possível carregar o dashboard.")).toBeInTheDocument();
    expect(screen.getByText("Erro de conexão")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tentar novamente/i })).toBeInTheDocument();
  });

  // ── 4.6 — Botão de retry chama refetch ───────────────────────────────────
  it("chama refetch ao clicar em 'Tentar novamente'", () => {
    const mockRefetch = vi.fn();
    mockUseAdminDashboard.mockReturnValue({
      data: null,
      isLoading: false,
      error: "Erro de conexão",
      refetch: mockRefetch,
    });

    render(<AdminDashboard />);

    fireEvent.click(screen.getByRole("button", { name: /tentar novamente/i }));

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  // ── 4.4 — Exibe mensagem quando não há dados no gráfico ──────────────────
  it("exibe mensagem quando não há cadastros nos últimos 30 dias", () => {
    mockUseAdminDashboard.mockReturnValue({
      data: {
        total_apoiadores: 0,
        total_lideres: 0,
        cadastros_por_dia: [],
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AdminDashboard />);

    expect(
      screen.getByText(/nenhum cadastro registrado nos últimos 30 dias/i)
    ).toBeInTheDocument();
  });
});
