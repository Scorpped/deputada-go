import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

  // Collect options via context so SelectItem can register with the parent Select
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
      setOptions((prev) => {
        if (prev.find((o) => o.value === opt.value)) return prev;
        return [...prev, opt];
      });
    }, []);

    return (
      <OptionsContext.Provider value={{ register }}>
        {/* Render children to collect options via SelectItem */}
        <div style={{ display: "none" }}>{children}</div>
        <select
          data-testid="cidade-select"
          value={value ?? ""}
          onChange={(e) => onValueChange?.(e.target.value)}
        >
          <option value="">Selecione a cidade/RA</option>
          {options.map((o) => (
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

vi.mock("@/hooks/useIndicador", () => ({
  useIndicador: () => ({
    data: undefined,
    isLoading: false,
  }),
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

/** Simulate typing into a react-hook-form uncontrolled input.
 *  fireEvent.change with { target: { value } } assigns the value to the element
 *  before dispatching, which is what react-hook-form's onChange reads. */
function typeIntoInput(element: HTMLElement, value: string) {
  fireEvent.change(element, { target: { value } });
}

/** Fill all required form fields with valid values */
function fillForm() {
  typeIntoInput(screen.getByLabelText(/nome completo/i), "João Silva");
  typeIntoInput(screen.getByLabelText(/whatsapp/i), "61999999999");
  typeIntoInput(screen.getByLabelText(/data de nascimento/i), "20/05/1990");
  typeIntoInput(screen.getByLabelText(/endereço/i), "QNM 38 Conjunto F, 12");
  typeIntoInput(screen.getByLabelText(/e-mail/i), "joao@email.com");

  // Native <select> rendered by our mock
  fireEvent.change(screen.getByTestId("cidade-select"), {
    target: { value: "Ceilândia (RA-09)" },
  });

  // Native <input type="checkbox"> rendered by our mock
  const checkbox = screen.getByRole("checkbox");
  fireEvent.click(checkbox);
}

// ─── Success response fixture ─────────────────────────────────────────────────

const successBody = {
  id: 1,
  nome: "João Silva",
  cidade: "Ceilândia (RA-09)",
  referral_code: "ABC12345",
  referral_link: "http://localhost:8000/?ref=ABC12345",
  lgpd_aceito_em: "2024-01-01T00:00:00.000Z",
  created_at: "2024-01-01T00:00:00.000Z",
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Index page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── 8.2 — Exemplo 3: seção "Indicado por" não renderizada sem parâmetro ref ──

  it("Exemplo 3: não renderiza seção 'Indicado por' quando não há parâmetro ref", () => {
    renderIndex(["/"]);
    expect(screen.queryByText(/indicado por/i)).not.toBeInTheDocument();
  });

  // ── 8.3 — Exemplo 1: tela de sucesso exibida após HTTP 201 ──────────────────

  it("Exemplo 1: exibe tela de confirmação após HTTP 201", async () => {
    mockMutateAsync.mockResolvedValue(successBody);
    renderIndex(["/"]);

    fillForm();
    fireEvent.submit(screen.getByRole("button", { name: /enviar cadastro/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/cadastro recebido/i)).toBeInTheDocument();
    });
  });

  // ── 8.4 — Exemplo 2: toast.success chamado após HTTP 201 ─────────────────────

  it("Exemplo 2: chama toast.success após HTTP 201", async () => {
    mockMutateAsync.mockResolvedValue(successBody);
    renderIndex(["/"]);

    fillForm();
    fireEvent.submit(screen.getByRole("button", { name: /enviar cadastro/i }).closest("form")!);

    const { toast } = await import("sonner");
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  // ── 8.5 — Exemplo 4: toast.error chamado após HTTP 500 ───────────────────────

  it("Exemplo 4: chama toast.error após HTTP 500", async () => {
    mockMutateAsync.mockRejectedValue(
      new Error("Ocorreu um erro ao enviar o cadastro. Tente novamente.")
    );
    renderIndex(["/"]);

    fillForm();
    fireEvent.submit(screen.getByRole("button", { name: /enviar cadastro/i }).closest("form")!);

    const { toast } = await import("sonner");
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  // ── 8.6 — Req 6.5: formulário mantém valores após erro 422 ───────────────────

  it("Req 6.5: formulário mantém valores dos campos após erro 422", async () => {
    const { ValidationError } = await import("@/lib/api");
    mockMutateAsync.mockRejectedValue(
      new ValidationError({ email: ["O campo email já está em uso."] })
    );
    renderIndex(["/"]);

    fillForm();
    fireEvent.submit(screen.getByRole("button", { name: /enviar cadastro/i }).closest("form")!);

    await waitFor(() => {
      // After 422, the form should still be visible (not replaced by success screen)
      expect(screen.getByRole("button", { name: /enviar cadastro/i })).toBeInTheDocument();
    });

    // Fields should retain their values
    expect(screen.getByLabelText(/nome completo/i)).toHaveValue("João Silva");
    expect(screen.getByLabelText(/e-mail/i)).toHaveValue("joao@email.com");
  });

  // ── 8.7 — Req 3.6: botão fica desabilitado durante submissão ─────────────────
  // We test this by rendering with isPending=true (simulating mid-flight state)

  it("Req 3.6: botão fica desabilitado quando isPending é true", () => {
    mockIsPending = true;
    renderIndex(["/"]);

    const btn = screen.getByRole("button", { name: /enviando/i });
    expect(btn).toBeDisabled();
  });
});
