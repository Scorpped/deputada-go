import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockUser = {
  id: 1,
  name: "Admin User",
  email: "admin@example.com",
  role: "admin" as const,
};

const mockToken = "test-token-abc123";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFetchResponse(status: number, body: unknown, ok?: boolean) {
  return {
    ok: ok ?? (status >= 200 && status < 300),
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AuthContext — unit tests", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  // ── 1.2, 1.6 — Successful login stores token and user ─────────────────────
  it("login bem-sucedido armazena token e user no contexto e no localStorage", async () => {
    // No stored token → no /me call on mount
    vi.mocked(fetch).mockResolvedValue(
      makeFetchResponse(200, { token: mockToken, user: mockUser }) as unknown as Response
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("admin@example.com", "password123");
    });

    expect(result.current.token).toBe(mockToken);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem("auth_token")).toBe(mockToken);
  });

  // ── 1.6 — Logout clears context and localStorage ──────────────────────────
  it("logout limpa o contexto e o localStorage", async () => {
    // First login
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        makeFetchResponse(200, { token: mockToken, user: mockUser }) as unknown as Response
      )
      // logout endpoint
      .mockResolvedValueOnce(
        makeFetchResponse(200, {}) as unknown as Response
      );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("admin@example.com", "password123");
    });

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  // ── 7.3 — auth:expired event triggers automatic logout ────────────────────
  it("evento auth:expired dispara logout automático e limpa o estado", async () => {
    // Login first
    vi.mocked(fetch).mockResolvedValue(
      makeFetchResponse(200, { token: mockToken, user: mockUser }) as unknown as Response
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("admin@example.com", "password123");
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Dispatch auth:expired event
    await act(async () => {
      window.dispatchEvent(new CustomEvent("auth:expired"));
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  // ── 1.7 — Unauthenticated state when no token in localStorage ─────────────
  it("isAuthenticated é false quando não há token no localStorage", () => {
    localStorage.clear();

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  // ── 1.2 — Token persisted to localStorage after login ─────────────────────
  it("token é persistido no localStorage após login", async () => {
    vi.mocked(fetch).mockResolvedValue(
      makeFetchResponse(200, { token: mockToken, user: mockUser }) as unknown as Response
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("admin@example.com", "password123");
    });

    expect(localStorage.getItem("auth_token")).toBe(mockToken);
  });

  // ── 1.6 — localStorage cleared after logout ───────────────────────────────
  it("localStorage é limpo após logout", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        makeFetchResponse(200, { token: mockToken, user: mockUser }) as unknown as Response
      )
      .mockResolvedValueOnce(
        makeFetchResponse(200, {}) as unknown as Response
      );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("admin@example.com", "password123");
    });

    expect(localStorage.getItem("auth_token")).toBe(mockToken);

    await act(async () => {
      await result.current.logout();
    });

    expect(localStorage.getItem("auth_token")).toBeNull();
  });

  // ── 1.4 — Login failure throws error ──────────────────────────────────────
  it("login com credenciais inválidas lança erro", async () => {
    vi.mocked(fetch).mockResolvedValue(
      makeFetchResponse(401, { message: "Credenciais inválidas." }, false) as unknown as Response
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      act(async () => {
        await result.current.login("wrong@example.com", "wrongpassword");
      })
    ).rejects.toThrow("Credenciais inválidas.");

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
  });

  // ── On mount with stored token, fetches /me and restores user ─────────────
  it("ao montar com token no localStorage, busca /me e restaura o usuário", async () => {
    localStorage.setItem("auth_token", mockToken);

    vi.mocked(fetch).mockResolvedValue(
      makeFetchResponse(200, mockUser) as unknown as Response
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(result.current.isAuthenticated).toBe(true);
  });

  // ── On mount with invalid stored token, clears state ─────────────────────
  it("ao montar com token inválido no localStorage, limpa o estado", async () => {
    localStorage.setItem("auth_token", "invalid-token");

    vi.mocked(fetch).mockResolvedValue(
      makeFetchResponse(401, { message: "Unauthorized" }, false) as unknown as Response
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
