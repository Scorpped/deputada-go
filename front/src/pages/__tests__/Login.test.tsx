import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "@/pages/Login";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    isLoading: false,
    user: null,
    token: null,
    logout: vi.fn(),
  }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Login — testes de componente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1.4 — Renderização do formulário ──────────────────────────────────────
  it("renderiza o formulário de login com campos de email e senha", () => {
    renderLogin();

    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  // ── 1.4 — Estado de loading durante submit ────────────────────────────────
  it("exibe 'Entrando...' e desabilita o botão durante o submit", async () => {
    // login resolves after a delay so we can observe the loading state
    mockLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderLogin();

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /entrando/i })).toBeDisabled();
    });
  });

  // ── 1.5 — Exibição de erro em credenciais inválidas ───────────────────────
  it("exibe mensagem de erro do servidor quando login falha", async () => {
    mockLogin.mockRejectedValue(new Error("Credenciais inválidas."));

    renderLogin();

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: "wrongpassword" },
    });

    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText("Credenciais inválidas.")).toBeInTheDocument();
    });
  });

  // ── 1.4 — Navegação para /painel após login bem-sucedido ──────────────────
  it("navega para /painel após login bem-sucedido", async () => {
    mockLogin.mockResolvedValue(undefined);

    renderLogin();

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/painel");
    });
  });

  // ── 1.4 — Validação de campos obrigatórios ────────────────────────────────
  it("exibe erros de validação quando campos estão vazios", async () => {
    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/e-mail é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/senha é obrigatória/i)).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });
});
