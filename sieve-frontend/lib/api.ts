import { getToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const token = getToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.status === 401) {
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const token = getToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (res.status === 401) {
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const token = getToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    if (res.status === 401) {
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
};