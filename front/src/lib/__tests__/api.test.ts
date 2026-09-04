import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { postCadastro, ValidationError } from "@/lib/api";
import type { CadastroPayload } from "@/lib/api";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const validPayload: CadastroPayload = {
  nome: "João Silva",
  whatsapp: "11999999999",
  data_nascimento: "1990-01-01",
  endereco: "Rua das Flores, 123",
  cidade: "São Paulo",
  email: "joao@example.com",
  lgpd_aceito: true,
};

const successResponse = {
  id: 1,
  nome: "João Silva",
  cidade: "São Paulo",
  referral_code: "ABC123",
  referral_link: "http://localhost:8000/ref/ABC123",
  lgpd_aceito_em: "2024-01-01T00:00:00.000Z",
  created_at: "2024-01-01T00:00:00.000Z",
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeFetchResponse(status: number, body: unknown, ok?: boolean) {
  return {
    ok: ok ?? (status >= 200 && status < 300),
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("postCadastro", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // 6.2 — 201 success
  it("retorna dados corretos para resposta 201", async () => {
    vi.mocked(fetch).mockResolvedValue(
      makeFetchResponse(201, successResponse) as unknown as Response
    );

    const result = await postCadastro(validPayload);

    expect(result).toEqual(successResponse);
  });

  // 6.3 — 422 ValidationError
  it("lança ValidationError com errors correto para resposta 422", async () => {
    const errorsBody = {
      message: "The given data was invalid.",
      errors: {
        email: ["O campo email já está em uso."],
        whatsapp: ["O campo whatsapp é obrigatório."],
      },
    };

    vi.mocked(fetch).mockResolvedValue(
      makeFetchResponse(422, errorsBody, false) as unknown as Response
    );

    await expect(postCadastro(validPayload)).rejects.toThrow(ValidationError);

    try {
      await postCadastro(validPayload);
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).errors).toEqual(errorsBody.errors);
    }
  });

  // 6.4 — 500 generic Error
  it("lança Error genérico para resposta 500", async () => {
    vi.mocked(fetch).mockResolvedValue(
      makeFetchResponse(500, { message: "Internal Server Error" }, false) as unknown as Response
    );

    await expect(postCadastro(validPayload)).rejects.toThrow(
      "Internal Server Error"
    );
    await expect(postCadastro(validPayload)).rejects.not.toBeInstanceOf(
      ValidationError
    );
  });

  // 6.5 — network failure (edge case)
  it("lança erro com mensagem de conectividade quando fetch falha na rede", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(postCadastro(validPayload)).rejects.toThrow(
      "Sem conexão com o servidor. Verifique sua internet e tente novamente."
    );
  });

  // 6.6 — VITE_API_URL fallback (edge case)
  it("usa fallback http://localhost:8000 quando VITE_API_URL não está definido", async () => {
    vi.mocked(fetch).mockResolvedValue(
      makeFetchResponse(201, successResponse) as unknown as Response
    );

    await postCadastro(validPayload);

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain("localhost:8000");
  });
});
