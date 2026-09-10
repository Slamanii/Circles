import { getToken } from "./secureStorage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function authHeaders(): Promise<Record<string, string>> {
    const token = await getToken();
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

async function request<T = any>(
    path: string,
    options: { method?: string; body?: any; errorMessage?: string; headers?: Record<string, string> } = {},
): Promise<T> {
    const { method = "GET", body, errorMessage, headers } = options;
    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: { ...await authHeaders(), ...headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? errorMessage ?? `Request failed (${res.status})`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
}

export const api = {
    get: <T = any>(path: string, errorMessage?: string, headers?: Record<string, string>) =>
        request<T>(path, { errorMessage, headers }),
    post: <T = any>(path: string, body?: any, errorMessage?: string, headers?: Record<string, string>) =>
        request<T>(path, { method: "POST", body, errorMessage, headers }),
    put: <T = any>(path: string, body?: any, errorMessage?: string) =>
        request<T>(path, { method: "PUT", body, errorMessage }),
};
