const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const API_KEY = process.env.NEXT_PUBLIC_SIEVE_API_KEY || "";

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      "x-api-key": API_KEY,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error ${res.status}: ${error}`);
  }

  return res.json();
}

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    return fetchWithAuth(endpoint, { method: "GET" });
  },

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return fetchWithAuth(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return fetchWithAuth(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    return fetchWithAuth(endpoint, {
      method: "POST",
      body: formData,
    });
  },
};