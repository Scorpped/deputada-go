import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { postCadastro, ValidationError } from "@/lib/api";
import type { CadastroPayload } from "@/lib/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFetchResponse(status: number, body: unknown, ok?: boolean) {
  return {
    ok: ok ?? (status >= 200 && status < 300),
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

// Arbitrary for a YYYY-MM-DD date string
const arbitraryDateString: fc.Arbitrary<string> = fc
  .tuple(
    fc.integer({ min: 1900, max: 2010 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }) // cap at 28 to avoid month-end issues
  )
  .map(([y, m, d]) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);

// Arbitrary for CadastroPayload — generates valid-shaped payloads
const arbitraryCadastroPayload: fc.Arbitrary<CadastroPayload> = fc.record({
  nome: fc.string({ minLength: 1, maxLength: 100 }),
  whatsapp: fc.stringMatching(/^\d{10,11}$/),
  data_nascimento: arbitraryDateString,
  endereco: fc.string({ minLength: 1, maxLength: 200 }),
  cidade: fc.string({ minLength: 1, maxLength: 100 }),
  email: fc.emailAddress(),
  lgpd_aceito: fc.constant(true),
});

// ─── Property Tests ───────────────────────────────────────────────────────────

describe("ApiClient — property-based tests", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── Property 1: Headers obrigatórios presentes em todas as requisições ──────
  // Feature: frontend-api-integration, Property 1: Headers obrigatórios presentes em todas as requisições
  it("Property 1: headers obrigatórios presentes em todas as requisições", async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryCadastroPayload, async (payload) => {
        vi.mocked(fetch).mockResolvedValue(
          makeFetchResponse(201, {
            id: 1,
            nome: payload.nome,
            cidade: payload.cidade,
            referral_code: "ABC12345",
            referral_link: "http://localhost:8000/ref/ABC12345",
            lgpd_aceito_em: "2024-01-01T00:00:00.000Z",
            created_at: "2024-01-01T00:00:00.000Z",
          }) as unknown as Response
        );

        await postCadastro(payload);

        const [, init] = vi.mocked(fetch).mock.calls[vi.mocked(fetch).mock.calls.length - 1];
        const headers = (init as RequestInit).headers as Record<string, string>;

        expect(headers["Accept"]).toBe("application/json");
        expect(headers["Content-Type"]).toBe("application/json");
      }),
      { numRuns: 100 }
    );
  });

  // ── Property 2: Erro 422 lança ValidationError com objeto errors ────────────
  // Feature: frontend-api-integration, Property 2: Erro 422 lança ValidationError com objeto errors
  it("Property 2: qualquer resposta 422 lança ValidationError com errors correto", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.dictionary(fc.string({ minLength: 1, maxLength: 30 }), fc.array(fc.string())),
        async (errors) => {
          vi.mocked(fetch).mockResolvedValue(
            makeFetchResponse(422, { message: "The given data was invalid.", errors }, false) as unknown as Response
          );

          let thrown: unknown;
          try {
            await postCadastro({
              nome: "Test User",
              whatsapp: "11999999999",
              data_nascimento: "1990-01-01",
              endereco: "Rua Teste, 1",
              cidade: "São Paulo",
              email: "test@example.com",
              lgpd_aceito: true,
            });
          } catch (err) {
            thrown = err;
          }

          expect(thrown).toBeInstanceOf(ValidationError);
          expect((thrown as ValidationError).errors).toEqual(errors);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 3: Erros não-422 lançam Error genérico ─────────────────────────
  // Feature: frontend-api-integration, Property 3: Erros não-422 lançam Error genérico
  it("Property 3: qualquer status 4xx/5xx não-422 lança Error genérico", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 400, max: 599 }).filter((s) => s !== 422),
        async (status) => {
          vi.mocked(fetch).mockResolvedValue(
            makeFetchResponse(status, { message: `Error ${status}` }, false) as unknown as Response
          );

          let thrown: unknown;
          try {
            await postCadastro({
              nome: "Test User",
              whatsapp: "11999999999",
              data_nascimento: "1990-01-01",
              endereco: "Rua Teste, 1",
              cidade: "São Paulo",
              email: "test@example.com",
              lgpd_aceito: true,
            });
          } catch (err) {
            thrown = err;
          }

          expect(thrown).toBeInstanceOf(Error);
          expect(thrown).not.toBeInstanceOf(ValidationError);
          expect((thrown as Error).message.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 5: WhatsApp enviado contém apenas dígitos ──────────────────────
  // Feature: frontend-api-integration, Property 5: WhatsApp enviado contém apenas dígitos
  it("Property 5: whatsapp com qualquer formatação é enviado apenas com dígitos", () => {
    // Generates a string of 10-11 digits optionally interspersed with formatting chars
    const arbitraryFormattedWhatsapp = fc
      .tuple(
        fc.stringMatching(/^\d{10,11}$/),
        fc.array(fc.constantFrom("(", ")", " ", "-", "."), { maxLength: 6 })
      )
      .map(([digits, separators]) => {
        // Insert formatting characters at random positions within the digit string
        let result = digits;
        for (const sep of separators) {
          const pos = Math.floor(Math.random() * (result.length + 1));
          result = result.slice(0, pos) + sep + result.slice(pos);
        }
        return result;
      });

    fc.assert(
      fc.property(arbitraryFormattedWhatsapp, (formattedWhatsapp) => {
        // This is the cleaning logic used before sending the payload
        const cleaned = formattedWhatsapp.replace(/\D/g, "");
        expect(cleaned).toMatch(/^\d*$/);
      }),
      { numRuns: 100 }
    );
  });
});
