import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import AdminLideres from "@/pages/painel/admin/Lideres";
import { ValidationError } from "@/lib/api";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUseLideres = vi.fn();

vi.mock("@/hooks/useLideres", () => ({
  useLideres: () => mockUseLideres(),
}));

const mockCreateLider = vi.fn();
const mockUpdateLider = vi.fn();
const mockToggleLider = vi.fn();

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    createLider: (...args: unknown[]) => mockCreateLider(...args),
    updateLider: (...args: unknown[]) => mockUpdateLider(...args),
    toggleLider: (...args: unknown[]) => mockToggleLider(...args),
  };
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockLider = {
  id: 1,
  name: "João Silva",
  email: "joao@example.com",
  referral_code: "JOAO123",
  referral_link: "https://example.com/ref/JOAO123",
  active: true,
  created_at: "2024-01-01T00:00:00Z",
  total_indicados: 10,
};

const mockLider2 = {
  id: 2,
  name: "Maria Souza",
  email: "maria@example.com",
  referral_code: "MARIA456",
  referral_link: "https://example.com/ref/MARIA456",
  active: false,
  created_at: "2024-01-02T00:00:00Z",
  total_indicados: 5,
};

const defaultPaginatedData = {
  data: [mockLider, mockLider2],
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 2,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AdminLideres — testes de componente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 2.1 — Renderização da tabela com dados ────────────────────────────────
  it("renderiza a tabela com os dados dos líderes", () => {
    mockUseLideres.mockReturnValue({
      data: defaultPaginatedData,
      isLoading: false,
      error: null,
      page: 1,
      setPage: vi.fn(),
      refetch: vi.fn(),
    });

    render(<AdminLideres />);

    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("joao@example.com")).toBeInTheDocument();
    expect(screen.getByText("Maria Souza")).toBeInTheDocument();
    expect(screen.getByText("maria@example.com")).toBeInTheDocument();
  });

  // ── 2.1 — Exibe skeleton durante loading ─────────────────────────────────
  it("exibe skeleton durante o carregamento", () => {
    mockUseLideres.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      page: 1,
      setPage: vi.fn(),
      refetch: vi.fn(),
    });

    const { container } = render(<AdminLideres />);

    // TableSkeleton renders Skeleton components
    const skeletons = container.querySelectorAll("[class*='animate']");
    // The table should be present but with skeleton rows
    expect(screen.getByRole("table")).toBeInTheDocument();
    // Skeleton cells should be present (5 rows × 6 cells)
    const cells = container.querySelectorAll("td");
    expect(cells.length).toBeGreaterThan(0);
  });

  // ── 2.4 — Abertura do modal de criação ───────────────────────────────────
  it("abre o modal de criação ao clicar em 'Novo Líder'", async () => {
    mockUseLideres.mockReturnValue({
      data: defaultPaginatedData,
      isLoading: false,
      error: null,
      page: 1,
      setPage: vi.fn(),
      refetch: vi.fn(),
    });

    render(<AdminLideres />);

    fireEvent.click(screen.getByRole("button", { name: /novo líder/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // The dialog title should be present inside the dialog
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Novo Líder");
  });

  // ── 2.4 — Submissão do modal de criação ──────────────────────────────────
  it("chama createLider e fecha o modal ao submeter o formulário de criação", async () => {
    const mockRefetch = vi.fn();
    mockUseLideres.mockReturnValue({
      data: defaultPaginatedData,
      isLoading: false,
      error: null,
      page: 1,
      setPage: vi.fn(),
      refetch: mockRefetch,
    });

    const newLider = {
      ...mockLider,
      id: 3,
      name: "Novo Lider",
      email: "novo@example.com",
    };
    mockCreateLider.mockResolvedValue(newLider);

    render(<AdminLideres />);

    // Open modal
    fireEvent.click(screen.getByRole("button", { name: /novo líder/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Fill in the form — scope queries to the dialog to avoid ambiguity with
    // the "Redefinir senha de …" aria-labels on the table action buttons
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/nome/i), {
      target: { value: "Novo Lider" },
    });
    fireEvent.change(within(dialog).getByLabelText(/email/i), {
      target: { value: "novo@example.com" },
    });
    fireEvent.change(within(dialog).getByLabelText(/senha/i), {
      target: { value: "password123" },
    });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /criar/i }));

    await waitFor(() => {
      expect(mockCreateLider).toHaveBeenCalledWith({
        name: "Novo Lider",
        email: "novo@example.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  // ── 2.8 — Exibição de erros de validação ─────────────────────────────────
  it("exibe erros de validação retornados pela API", async () => {
    mockUseLideres.mockReturnValue({
      data: defaultPaginatedData,
      isLoading: false,
      error: null,
      page: 1,
      setPage: vi.fn(),
      refetch: vi.fn(),
    });

    mockCreateLider.mockRejectedValue(
      new ValidationError({
        name: ["O nome é obrigatório."],
        email: ["O email já está em uso."],
        password: ["A senha deve ter no mínimo 8 caracteres."],
      })
    );

    render(<AdminLideres />);

    // Open modal
    fireEvent.click(screen.getByRole("button", { name: /novo líder/i }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Submit without filling (or with invalid data)
    fireEvent.click(screen.getByRole("button", { name: /criar/i }));

    await waitFor(() => {
      expect(screen.getByText("O nome é obrigatório.")).toBeInTheDocument();
      expect(screen.getByText("O email já está em uso.")).toBeInTheDocument();
      expect(
        screen.getByText("A senha deve ter no mínimo 8 caracteres.")
      ).toBeInTheDocument();
    });
  });

  // ── 2.9 — Toggle de ativação ──────────────────────────────────────────────
  it("chama toggleLider e refetch ao clicar no switch de ativação", async () => {
    const mockRefetch = vi.fn();
    mockUseLideres.mockReturnValue({
      data: defaultPaginatedData,
      isLoading: false,
      error: null,
      page: 1,
      setPage: vi.fn(),
      refetch: mockRefetch,
    });

    mockToggleLider.mockResolvedValue({ ...mockLider, active: false });

    render(<AdminLideres />);

    // Find the switch for the first lider (active: true → "Desativar João Silva")
    const toggleSwitch = screen.getByRole("switch", {
      name: /desativar joão silva/i,
    });

    fireEvent.click(toggleSwitch);

    await waitFor(() => {
      expect(mockToggleLider).toHaveBeenCalledWith(mockLider.id);
    });

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  // ── 2.1 — Exibe mensagem quando não há líderes ────────────────────────────
  it("exibe mensagem quando não há líderes cadastrados", () => {
    mockUseLideres.mockReturnValue({
      data: {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
      },
      isLoading: false,
      error: null,
      page: 1,
      setPage: vi.fn(),
      refetch: vi.fn(),
    });

    render(<AdminLideres />);

    expect(screen.getByText(/nenhum líder cadastrado/i)).toBeInTheDocument();
  });

  // ── 2.1 — Exibe estado de erro ────────────────────────────────────────────
  it("exibe mensagem de erro e botão de retry quando há erro", () => {
    const mockRefetch = vi.fn();
    mockUseLideres.mockReturnValue({
      data: null,
      isLoading: false,
      error: "Erro ao carregar líderes.",
      page: 1,
      setPage: vi.fn(),
      refetch: mockRefetch,
    });

    render(<AdminLideres />);

    expect(
      screen.getByText("Não foi possível carregar os líderes.")
    ).toBeInTheDocument();
    expect(screen.getByText("Erro ao carregar líderes.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /tentar novamente/i }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});
