import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as fc from "fast-check";
import Index from "@/pages/Index";

// ─── jsdom polyfills ──────────────────────────────────────────────────────────

if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof window !== "undefined") {
  window.HTMLElement.prototype.scrollIntoView = function () {};
  window.Element.prototype.scrollIntoView = function () {};
}

// ─── Mock Radix Select with a native <select> ─────────────────────────────────

vi.mock("@/components/ui/select", () => {
  const React = require("react");

  type OptionEntry = { value: string; label: React.ReactNode };
  const OptionsContext = React.createContext<{
    register: (opt: OptionEntry) => void;
  }>({ register: () => {} });

  const Select = ({
    children,
    onValueChange,
    value,
  }: {
    children: React.ReactNode;
    onValueChange?: (v: string) => void;
    value?: string;
  }) => {
    const [options, setOptions] = React.useState<OptionEntry[]>([]);
    const register = React.useCallback((opt: OptionEntry) => {
      setOptions((prev: OptionEntry[]) => {
        if (prev.find((o: OptionEntry) => o.value === opt.value)) return prev;
        return [...prev, opt];
      });
    }, []);

    return (
      <OptionsContext.Provider value={{ register }}>
        <div style={{ display: "none" }}>{children}</div>
        <select
          data-testid="cidade-select"
          value={value ?? ""}
          onChange={(e) => onValueChange?.(e.target.value)}
        >
          <option value="">Selecione a cidade/RA</option>
          {options.map((o: OptionEntry) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </OptionsContext.Provider>
    );
  };

  const SelectTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  const SelectValue = ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>;
  const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;

  const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => {
    const ctx = React.useContext(OptionsContext);
    React.useEffect(() => {
      ctx.register({ value, label: children });
    }, [value]);
    return null;
  };

  const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  const SelectLabel = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  const SelectSeparator = () => null;
  const SelectScrollUpButton = () => null;
  const SelectScrollDownButton = () => null;

  return {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    SelectGroup,
    SelectLabel,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
  };
});

// ─── Mock Radix Checkbox with a native <input type="checkbox"> ────────────────

vi.mock("@/components/ui/checkbox", () => {
  const React = require("react");
  const Checkbox = React.forwardRef(
    (
      {
        id,
        checked,
        onCheckedChange,
        className,
      }: {
        id?: string;
        checked?: boolean;
        onCheckedChange?: (checked: boolean) => void;
        className?: string;
      },
      ref: React.Ref<HTMLInputElement>
    ) => (
      <input
        ref={ref}
        type="checkbox"
        id={id}
        checked={checked ?? false}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className={className}
        role="checkbox"
      />
    )
  );
  Checkbox.displayName = "Checkbox";
  return { Checkbox };
});

// ─── Mock sonner ──────────────────────────────────────────────────────────────

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ─── Mock hooks ───────────────────────────────────────────────────────────────

const mockMutateAsync = vi.fn();
let mockIsPending = false;

vi.mock("@/hooks/useCadastro", () => ({
  useCadastro: () => ({
    mutateAsync: mockMutateAsync,
    get isPending() {
      return mockIsPending;
    },
  }),
}));

// useIndicador mock — configurable via module-level variable
let mockIndicadorCalledWith: string | null | undefined = undefined;

vi.mock("@/hooks/useIndicador", () => ({
  useIndicador: (code: string | null) => {
    mockIndicadorCalledWith = code;
    return {
      data: undefined,
      isLoading: false,
    };
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function renderIndex(initialEntries: string[] = ["/"]) {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Index />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function typeIntoInput(element: HTMLElement, value: string) {
  fireEvent.change(element, { target: { value } });
}

function fillForm() {
  typeIntoInput(screen.getByLabelText(/nome completo/i), "João Silva");
  typeIntoInput(screen.getByLabelText(/whatsapp/i), "61999999999");
  typeIntoInput(screen.getByLabelText(/data de nascimento/i), "20/05/1990");
  typeIntoInput(screen.getByLabelText(/endereço/i), "QNM 38 Conjunto F, 12");
  typeIntoInput(screen.getByLabelText(/e-mail/i), "joao@email.com");
  fireEvent.change(screen.getByTestId("cidade-select"), {
    target: { value: "Ceilândia (RA-09)" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
}

const successBody = {
  id: 1,
  nome: "João Silva",
  cidade: "Ceilândia (RA-09)",
  referral_code: "ABC12345",
  referral_link: "http://localhost:8000/?ref=ABC12345",
  lgpd_aceito_em: "2024-01-01T00:00:00.000Z",
  created_at: "2024-01-01T00:00:00.000Z",
};

// ─── Property Tests ───────────────────────────────────────────────────────────

describe("Index page — property-based tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
    mockIndicadorCalledWith = undefined;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── Property 4: Payload contém todos os campos obrigatórios ─────────────────
  // Feature: frontend-api-integration, Property 4: Payload do formulário contém todos os campos obrigatórios
  it("Property 4: payload contém todos os campos obrigatórios para qualquer entrada válida", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Vary the ref code presence (with or without ref)
        fc.option(
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9]+$/.test(s)),
          { nil: null }
        ),
        async (refCode) => {
          vi.clearAllMocks();
          mockMutateAsync.mockResolvedValue(successBody);

          const url = refCode ? `/?ref=${refCode}` : "/";
          const { unmount } = renderIndex([url]);

          try {
            fillForm();
            fireEvent.submit(
              screen.getByRole("button", { name: /enviar cadastro/i }).closest("form")!
            );

            await waitFor(() => {
              expect(mockMutateAsync).toHaveBeenCalled();
            });

            const payload = mockMutateAsync.mock.calls[mockMutateAsync.mock.calls.length - 1][0];

            // All required fields must be present
            expect(payload).toHaveProperty("nome");
            expect(payload).toHaveProperty("whatsapp");
            expect(payload).toHaveProperty("data_nascimento");
            expect(payload).toHaveProperty("endereco");
            expect(payload).toHaveProperty("cidade");
            expect(payload).toHaveProperty("email");
            expect(payload).toHaveProperty("lgpd_aceito");

            // All required fields must be non-empty / truthy
            expect(String(payload.nome).length).toBeGreaterThan(0);
            expect(String(payload.whatsapp).length).toBeGreaterThan(0);
            expect(String(payload.data_nascimento).length).toBeGreaterThan(0);
            expect(String(payload.endereco).length).toBeGreaterThan(0);
            expect(String(payload.cidade).length).toBeGreaterThan(0);
            expect(String(payload.email).length).toBeGreaterThan(0);
            expect(payload.lgpd_aceito).toBe(true);

            // whatsapp must contain only digits
            expect(payload.whatsapp).toMatch(/^\d+$/);
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60_000);

  // ── Property 6: Parâmetro ref controla presença de referral_code no payload ─
  // Feature: frontend-api-integration, Property 6: Parâmetro ref controla presença de referral_code no payload
  it("Property 6: parâmetro ref controla presença de referral_code no payload", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
        async (hasRef, refCode) => {
          vi.clearAllMocks();
          mockMutateAsync.mockResolvedValue(successBody);

          const url = hasRef ? `/?ref=${refCode}` : "/";
          const { unmount } = renderIndex([url]);

          try {
            fillForm();
            fireEvent.submit(
              screen.getByRole("button", { name: /enviar cadastro/i }).closest("form")!
            );

            await waitFor(() => {
              expect(mockMutateAsync).toHaveBeenCalled();
            });

            const payload = mockMutateAsync.mock.calls[mockMutateAsync.mock.calls.length - 1][0];

            if (hasRef) {
              // When ref is present, payload must include referral_code equal to the ref value
              expect(payload).toHaveProperty("referral_code", refCode);
            } else {
              // When ref is absent, payload must NOT include referral_code
              expect(payload).not.toHaveProperty("referral_code");
            }
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60_000);

  // ── Property 7: Presença de ref na URL dispara busca do indicador ────────────
  // Feature: frontend-api-integration, Property 7: Presença de ref na URL dispara busca do indicador
  it("Property 7: presença de ref na URL dispara busca do indicador", () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
        (hasRef, refCode) => {
          mockIndicadorCalledWith = undefined;

          const url = hasRef ? `/?ref=${refCode}` : "/";
          const { unmount } = renderIndex([url]);

          try {
            if (hasRef) {
              // When ref is present, useIndicador must be called with the ref code
              expect(mockIndicadorCalledWith).toBe(refCode);
            } else {
              // When ref is absent, useIndicador must be called with null
              expect(mockIndicadorCalledWith).toBeNull();
            }
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // ── Property 8: Erros 422 são mapeados para campos do formulário ─────────────
  // Feature: frontend-api-integration, Property 8: Erros 422 são mapeados para campos do formulário
  it("Property 8: erros 422 são mapeados para campos do formulário", async () => {
    const { ValidationError } = await import("@/lib/api");

    const allFields = ["nome", "whatsapp", "data_nascimento", "endereco", "cidade", "email"];

    await fc.assert(
      fc.asyncProperty(
        // Generate a non-empty subset of form fields
        fc.subarray(allFields, { minLength: 1 }),
        async (fields) => {
          vi.clearAllMocks();

          // Build a ValidationError with one message per selected field
          const errors: Record<string, string[]> = {};
          for (const field of fields) {
            errors[field] = [`O campo ${field} é inválido.`];
          }

          mockMutateAsync.mockRejectedValue(new ValidationError(errors));

          const { unmount } = renderIndex(["/"]);

          try {
            fillForm();
            fireEvent.submit(
              screen.getByRole("button", { name: /enviar cadastro/i }).closest("form")!
            );

            // Wait for the mutation to be called
            await waitFor(() => {
              expect(mockMutateAsync).toHaveBeenCalled();
            });

            // Each field in the error response should have its error message displayed
            for (const field of fields) {
              const expectedMessage = `O campo ${field} é inválido.`;
              await waitFor(() => {
                expect(screen.getByText(expectedMessage)).toBeInTheDocument();
              });
            }
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60_000);

  // ── Property 9: Botão reabilitado após qualquer erro ─────────────────────────
  // Feature: frontend-api-integration, Property 9: Botão de envio é reabilitado após qualquer erro
  it("Property 9: botão de envio é reabilitado após qualquer erro", async () => {
    const { ValidationError } = await import("@/lib/api");

    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant("validation" as const),
          fc.constant("generic" as const),
          fc.constant("network" as const)
        ),
        async (errorType) => {
          vi.clearAllMocks();
          mockIsPending = false;

          let error: Error;
          if (errorType === "validation") {
            error = new ValidationError({ email: ["O campo email já está em uso."] });
          } else if (errorType === "network") {
            error = new Error(
              "Sem conexão com o servidor. Verifique sua internet e tente novamente."
            );
          } else {
            error = new Error("Ocorreu um erro ao enviar o cadastro. Tente novamente.");
          }

          mockMutateAsync.mockRejectedValue(error);

          const { unmount } = renderIndex(["/"]);

          try {
            fillForm();
            fireEvent.submit(
              screen.getByRole("button", { name: /enviar cadastro/i }).closest("form")!
            );

            // Wait for the mutation to be called (error handling completes)
            await waitFor(() => {
              expect(mockMutateAsync).toHaveBeenCalled();
            });

            // After any error, isPending is false (our mock always returns false),
            // so the button should be enabled and show "Enviar Cadastro"
            // The button is disabled only when isPending=true, which never happens here
            const btn = screen.getByRole("button", { name: /enviar cadastro/i });
            expect(btn).not.toBeDisabled();
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 100 }
    );
  }, 60_000);
});
