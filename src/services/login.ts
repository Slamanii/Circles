import { api } from "./apiClient";
import { setToken } from "./secureStorage";

export async function deleteAccount() {
    return api.post("/api/delete-account", undefined, "Failed to request account deletion");
}

export async function Login(email: string, password: string) {
    try {
        const data = await api.post("/api/login", { email, password }, "Failed to login");

        if (data.token) {
            await setToken(data.token);
        }
        return data;
    } catch (err) {
        console.error("login error:", err);
        throw err;
    }
}
