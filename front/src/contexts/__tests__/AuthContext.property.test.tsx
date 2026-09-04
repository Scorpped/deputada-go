/**
 * Property-based tests for AuthContext
 *
 * Property 2: login seguido de logout sempre resulta em estado não autenticado
 * Validates: Requirement 1.6
 *
 * Property 3: token persistido no localStorage é sempre o mesmo do estado do contexto
 * Validates: Requirement 1.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import * as fc from "fast-check";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import type { AuthUser } from "@/contexts/AuthContext";

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

// ─── Arbitraries ──────────────────────────────────────────────────────────────

/** Generates a non-empty token string */
const arbitraryToken: fc.Arbitrary<string> = fc.string({ minLength: 8, maxLength: 64 }).filter(
  (s) => s.trim().length > 0
);

/** Generates a valid AuthUser */
const arbitraryUser: fc.Arbitrary<AuthUser> = fc.record({
  id: fc.integer({ min: 1, max: 100000 }),
  name: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  email: fc.emailAddress(),
  role: fc.constantFrom("admin" as const, "lider" as const),
});

/** Generates a valid email string */
const arbitraryEmail: fc.Arbitrary<string> = fc.emailAddress();

/** Generates a non-empty password string */
const arbitraryPassword: fc.Arbitrary<string> = fc.string({ minLength: 6, maxLength: 50 }).filter(
  (s) => s.trim().length > 0
);

// ─── Property Tests ───────────────────────────────────────────────────────────

describe("AuthContext — property-based tests", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  /**
   * Property 2: login seguido de logout sempre resulta em estado não autenticado
   * Validates: Requirement 1.6
   *
   * For any valid (email, password, token, user) combination:
   * login() followed by logout() always results in:
   *   - isAuthenticated === false
   *   - token === null
   *   - user === null
   */
  it("Property 2: login seguido de logout sempre resulta em estado não autenticado", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryEmail,
        arbitraryPassword,
        arbitraryToken,
        arbitraryUser,
        async (email, password, token, user) => {
          localStorage.clear();

          vi.mocked(fetch)
            // login call
            .mockResolvedValueOnce(
              makeFetchResponse(200, { token, user }) as unknown as Response
            )
            // logout call
            .mockResolvedValueOnce(
              makeFetchResponse(200, {}) as unknown as Response
            );

          const { result, unmount } = renderHook(() => useAuth(), { wrapper });

          // Perform login
          await act(async () => {
            await result.current.login(email, password);
          });

          // Verify authenticated state after login
          expect(result.current.isAuthenticated).toBe(true);

          // Perform logout
          await act(async () => {
            await result.current.logout();
          });

          // Property: after logout, state must be unauthenticated
          expect(result.current.isAuthenticated).toBe(false);
          expect(result.current.token).toBeNull();
          expect(result.current.user).toBeNull();

          unmount();
        }
      ),
      { numRuns: 25 }
    );
  });

  /**
   * Property 3: token persistido no localStorage é sempre o mesmo do estado do contexto
   * Validates: Requirement 1.2
   *
   * After a successful login, the token in localStorage must always equal
   * the token in the context state.
   */
  it("Property 3: token persistido no localStorage é sempre o mesmo do estado do contexto", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryEmail,
        arbitraryPassword,
        arbitraryToken,
        arbitraryUser,
        async (email, password, token, user) => {
          localStorage.clear();

          vi.mocked(fetch).mockResolvedValueOnce(
            makeFetchResponse(200, { token, user }) as unknown as Response
          );

          const { result, unmount } = renderHook(() => useAuth(), { wrapper });

          await act(async () => {
            await result.current.login(email, password);
          });

          // Property: localStorage token must equal context token
          const storedToken = localStorage.getItem("auth_token");
          expect(storedToken).toBe(result.current.token);
          expect(storedToken).toBe(token);

          unmount();
        }
      ),
      { numRuns: 25 }
    );
  });
});
