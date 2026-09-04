import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUseAuth = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderProtectedRoute(
  initialPath: string,
  allowedRoles?: ("admin" | "lider")[]
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/painel/admin" element={<div>Admin Home</div>} />
        <Route path="/painel/lider" element={<div>Lider Home</div>} />
        <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
          <Route path="/" element={<div>Protected Content</div>} />
          <Route path="/painel" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ProtectedRoute — testes de componente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1.7 — Redirecionamento para /login sem autenticação ───────────────────
  it("redireciona para /login quando não autenticado", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    renderProtectedRoute("/");

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  // ── 1.7 — Renderiza null durante loading ──────────────────────────────────
  it("não renderiza nada enquanto isLoading é true", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    });

    const { container } = renderProtectedRoute("/");

    // ProtectedRoute returns null while loading — no redirect, no content
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  // ── 1.8 — Redirecionamento por role incorreta ─────────────────────────────
  it("redireciona lider para /painel/lider quando allowedRoles exige admin", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 2, name: "Lider User", email: "lider@example.com", role: "lider" },
    });

    renderProtectedRoute("/painel", ["admin"]);

    expect(screen.getByText("Lider Home")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  // ── 1.8 — Redirecionamento admin para /painel/admin quando role é lider ───
  it("redireciona admin para /painel/admin quando allowedRoles exige lider", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, name: "Admin User", email: "admin@example.com", role: "admin" },
    });

    renderProtectedRoute("/painel", ["lider"]);

    expect(screen.getByText("Admin Home")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  // ── 1.8 — Renderiza filho com role correta ────────────────────────────────
  it("renderiza o conteúdo protegido quando o usuário tem a role correta", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, name: "Admin User", email: "admin@example.com", role: "admin" },
    });

    renderProtectedRoute("/painel", ["admin"]);

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  // ── 1.7 — Renderiza filho quando autenticado sem restrição de role ────────
  it("renderiza o conteúdo protegido quando autenticado e sem restrição de role", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 2, name: "Lider User", email: "lider@example.com", role: "lider" },
    });

    renderProtectedRoute("/painel");

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });
});
