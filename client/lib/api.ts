/**
 * API utility module — centralised HTTP client for the FastAPI backend.
 *
 * Every request reads the JWT token from localStorage so that protected
 * endpoints work transparently.  The helpers return the parsed JSON
 * body directly (already unwrapped from the backend's BaseResponse
 * envelope when using the `apiRequest` wrapper).
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

/* ------------------------------------------------------------------ */
/*  Low-level helpers                                                  */
/* ------------------------------------------------------------------ */

function getToken(): string | null {
  return localStorage.getItem("token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    const message = json?.message ?? json?.detail ?? res.statusText;
    throw new Error(message);
  }
  return json as T;
}

/* ------------------------------------------------------------------ */
/*  Generic request helpers                                            */
/* ------------------------------------------------------------------ */

export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...authHeaders() },
  });
  return handleResponse<T>(res);
}

export async function apiPost<T = any>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiPut<T = any>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse<T>(res);
}

export async function apiPostFormData<T = any>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  });
  return handleResponse<T>(res);
}

/* ------------------------------------------------------------------ */
/*  Domain-specific endpoints                                          */
/* ------------------------------------------------------------------ */

// --- Auth ---
export const authApi = {
  register: (name: string, email: string, password: string) =>
    apiPost("/auth/register", { name, email, password }),
  login: (email: string, password: string) =>
    apiPost("/auth/login", { email, password }),
  getMe: () => apiGet("/auth/me"),
  updateMe: (data: { name?: string; email?: string }) =>
    apiPut("/auth/me", data),
  changePassword: (old_password: string, new_password: string) =>
    apiPut("/auth/me/password", { old_password, new_password }),
};

// --- Analysis ---
export const analysisApi = {
  getSessions: () => apiGet("/analysis"),
  getSession: (id: number) => apiGet(`/analysis/${id}`),
  sendText: (input_text: string) => apiPost("/analysis/text", { input_text }),
  sendAudio: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiPostFormData("/analysis/audio", fd);
  },
  deleteSession: (id: number) => apiDelete(`/analysis/${id}`),
};

// --- XAI ---
export const xaiApi = {
  predict: (text: string) => apiPost("/xai/predict", { text }),
  getHistory: () => apiGet("/xai/history"),
};
