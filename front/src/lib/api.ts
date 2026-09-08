const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/** localStorage key used by AuthContext to persist the Bearer token. */
const TOKEN_KEY = "auth_token";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CadastroPayload {
  nome: string;
  whatsapp: string;
  data_nascimento: string;
  endereco: string;
  cidade: string;
  email: string;
  lgpd_aceito: boolean;
  referral_code?: string;
}

export interface CadastroResponse {
  id: number;
  nome: string;
  cidade: string;
  referral_code: string;
  referral_link: string;
  lgpd_aceito_em: string;
  created_at: string;
}

export interface IndicadorResponse {
  data: Array<{ nome: string; cidade: string; data_cadastro: string }>;
}

// ─── Admin Panel Types ────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "lider";
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface Lider {
  id: number;
  name: string;
  email: string;
  referral_code: string;
  referral_link: string;
  active: boolean;
  created_at: string;
  total_indicados: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CreateLiderPayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateLiderPayload {
  name: string;
  email: string;
}

export interface Apoiador {
  id: number;
  nome: string;
  email: string;
  whatsapp: string;
  cidade: string;
  data_nascimento: string;
  referral_code: string | null;
  created_at: string;
  nome_indicador: string | null;
}

export interface CadastrosPorDia {
  data: string;
  quantidade: number;
}

export interface AdminDashboardResponse {
  total_apoiadores: number;
  total_lideres: number;
  cadastros_por_dia: CadastrosPorDia[];
}

export interface LiderDashboardResponse {
  total_indicados: number;
  cadastros_por_dia: CadastrosPorDia[];
  referral_code: string;
  referral_link: string;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface ApoiadoresParams extends PaginationParams {
  search?: string;
}

export class ValidationError extends Error {
  constructor(public errors: Record<string, string[]>) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  let body: { message?: string; errors?: Record<string, string[]> } = {};
  try {
    body = await response.json();
  } catch {
    // ignore parse errors — fall through to generic messages
  }

  if (response.status === 422) {
    throw new ValidationError(body.errors ?? {});
  }

  throw new Error(
    body.message ?? "Ocorreu um erro ao enviar o cadastro. Tente novamente."
  );
}

// ─── authFetch ────────────────────────────────────────────────────────────────

/**
 * Wrapper around `fetch` that:
 * 1. Injects `Authorization: Bearer {token}` from localStorage.
 * 2. Dispatches a `auth:expired` CustomEvent on the window when the server
 *    responds with HTTP 401, so that AuthContext can redirect to /login.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    throw new Error(
      "Sem conexão com o servidor. Verifique sua internet e tente novamente."
    );
  }

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent("auth:expired"));
  }

  return response;
}

// ─── ApiClient functions ──────────────────────────────────────────────────────

export async function postCadastro(
  data: CadastroPayload
): Promise<CadastroResponse> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/api/cadastro`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error(
      "Sem conexão com o servidor. Verifique sua internet e tente novamente."
    );
  }

  return handleResponse<CadastroResponse>(response);
}

export async function getIndicador(
  referralCode: string
): Promise<{ data: { nome: string } | null }> {
  let response: Response;
  try {
    response = await fetch(
      `${BASE_URL}/api/lider-info/${encodeURIComponent(referralCode)}`,
      { headers: { Accept: "application/json" } }
    );
  } catch {
    throw new Error(
      "Sem conexão com o servidor. Verifique sua internet e tente novamente."
    );
  }

  if (response.status === 404) return { data: null };
  return handleResponse<{ data: { nome: string } | null }>(response);
}

// ─── Auth endpoints ───────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error(
      "Sem conexão com o servidor. Verifique sua internet e tente novamente."
    );
  }

  return handleResponse<LoginResponse>(response);
}

export async function logout(): Promise<void> {
  const response = await authFetch(`${BASE_URL}/api/auth/logout`, {
    method: "POST",
  });

  if (!response.ok && response.status !== 401) {
    // Ignore errors on logout — the client-side state will be cleared regardless
  }
}

export async function getMe(): Promise<AuthUser> {
  const response = await authFetch(`${BASE_URL}/api/auth/me`);
  return handleResponse<AuthUser>(response);
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  current_password?: string;
  password?: string;
  password_confirmation?: string;
}

export async function updateProfile(
  payload: UpdateProfilePayload
): Promise<AuthUser> {
  const response = await authFetch(`${BASE_URL}/api/auth/profile`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthUser>(response);
}

// ─── Admin: Líderes endpoints ─────────────────────────────────────────────────

export async function getLideres(
  params: PaginationParams = {}
): Promise<PaginatedResponse<Lider>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.per_page !== undefined) query.set("per_page", String(params.per_page));

  const url = `${BASE_URL}/api/admin/lideres${query.toString() ? `?${query}` : ""}`;
  const response = await authFetch(url);
  return handleResponse<PaginatedResponse<Lider>>(response);
}

export async function createLider(
  data: CreateLiderPayload
): Promise<Lider> {
  const response = await authFetch(`${BASE_URL}/api/admin/lideres`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return handleResponse<Lider>(response);
}

export async function updateLider(
  id: number,
  data: UpdateLiderPayload
): Promise<Lider> {
  const response = await authFetch(`${BASE_URL}/api/admin/lideres/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return handleResponse<Lider>(response);
}

export async function toggleLider(id: number): Promise<Lider> {
  const response = await authFetch(
    `${BASE_URL}/api/admin/lideres/${id}/toggle`,
    { method: "PATCH" }
  );
  return handleResponse<Lider>(response);
}

export async function resetLiderPassword(id: number, password: string): Promise<void> {
  const response = await authFetch(
    `${BASE_URL}/api/admin/lideres/${id}/reset-password`,
    { method: "PATCH", body: JSON.stringify({ password }) }
  );
  return handleResponse<void>(response);
}

// ─── Admin: Apoiadores endpoint ───────────────────────────────────────────────

export async function getApoiadores(
  params: ApoiadoresParams = {}
): Promise<PaginatedResponse<Apoiador>> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.per_page !== undefined) query.set("per_page", String(params.per_page));
  if (params.search !== undefined && params.search !== "") {
    query.set("search", params.search);
  }

  const url = `${BASE_URL}/api/admin/apoiadores${query.toString() ? `?${query}` : ""}`;
  const response = await authFetch(url);
  return handleResponse<PaginatedResponse<Apoiador>>(response);
}

// ─── Dashboard endpoints ──────────────────────────────────────────────────────

export async function getAdminDashboard(): Promise<AdminDashboardResponse> {
  const response = await authFetch(`${BASE_URL}/api/admin/dashboard`);
  return handleResponse<AdminDashboardResponse>(response);
}

export async function getLiderDashboard(): Promise<LiderDashboardResponse> {
  const response = await authFetch(`${BASE_URL}/api/lider/dashboard`);
  return handleResponse<LiderDashboardResponse>(response);
}
