/**
 * Property-based tests for authFetch
 *
 * Property 1: authFetch always injects Authorization header with non-empty token
 * Validates: Requirement 7.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { authFetch } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFetchResponse(status: number, body: unknown, ok?: boolean) {
  return {
    ok: ok ?? (status >= 200 && status < 300),
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

// ─── Arbitraries ──────────────────────────────────────────────────────────────

/** Generates a non-empty token string (no whitespace-only strings) */
const arbitraryNonEmptyToken: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 128 })
  .filter((s) => s.trim().length > 0);

/** Generates a URL-like string */
const arbitraryUrl: fc.Arbitrary<string> = fc
  .constantFrom(
    "http://localhost:8000/api/admin/lideres",
    "http://localhost:8000/api/admin/apoiadores",
    "http://localhost:8000/api/auth/me",
    "http://localhost:8000/api/lider/dashboard",
    "http://localhost:8000/api/admin/dashboard"
  );

// ─── Property Tests ───────────────────────────────────────────────────────────

describe("authFetch — property-based tests", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  /**
   * Property 1: authFetch always injects Authorization header with non-empty token
   * Validates: Requirement 7.1
   *
   * For any non-empty token stored in localStorage, authFetch must always
   * include an Authorization header of the form "Bearer {token}".
   */
  it("Property 1: authFetch sempre injeta header Authorization com token não-vazio", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryNonEmptyToken,
        arbitraryUrl,
        async (token, url) => {
          localStorage.setItem("auth_token", token);

          vi.mocked(fetch).mockResolvedValue(
            makeFetchResponse(200, {}) as unknown as Response
          );

          await authFetch(url);

          const calls = vi.mocked(fetch).mock.calls;
          expect(calls.length).toBeGreaterThan(0);

          const lastCall = calls[calls.length - 1];
          const [, init] = lastCall;
          const headers = (init as RequestInit).headers as Record<string, string>;

          // Property: Authorization header must be present and equal "Bearer {token}"
          expect(headers["Authorization"]).toBe(`Bearer ${token}`);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Complementary: authFetch does NOT inject Authorization header when no token in localStorage
   */
  it("authFetch não injeta Authorization header quando não há token no localStorage", async () => {
    localStorage.clear();

    vi.mocked(fetch).mockResolvedValue(
      makeFetchResponse(200, {}) as unknown as Response
    );

    await authFetch("http://localhost:8000/api/auth/me");

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = (init as RequestInit).headers as Record<string, string>;

    expect(headers["Authorization"]).toBeUndefined();
  });

  /**
   * authFetch dispatches auth:expired event on HTTP 401
   */
  it("authFetch dispara evento auth:expired em resposta HTTP 401", async () => {
    localStorage.setItem("auth_token", "some-token");

    vi.mocked(fetch).mockResolvedValue(
      makeFetchResponse(401, { message: "Unauthorized" }, false) as unknown as Response
    );

    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    await authFetch("http://localhost:8000/api/auth/me");

    const authExpiredEvents = dispatchSpy.mock.calls.filter(
      ([event]) => event instanceof CustomEvent && event.type === "auth:expired"
    );
    expect(authExpiredEvents.length).toBeGreaterThan(0);

    dispatchSpy.mockRestore();
  });
});
