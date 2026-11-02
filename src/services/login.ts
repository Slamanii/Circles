import { api } from "./apiClient";
import { setToken } from "./secureStorage";

export async function deleteAccount() {
    return api.post("/api/delete-account", undefined, "Failed to request account deletion");
}

export async function requestPasswordReset(email: string) {
    return api.post("/api/request-password-reset", { email }, "Failed to request password reset");
}

export async function resetPassword(email: string, newPassword: string, resetToken: string) {
    return api.post("/api/reset-password", { email, newPassword, resetToken }, "Failed to reset password");
}

export async function Login(email: string, password: string, accountType?: string) {
    try {
        const data = await api.post("/api/login", { email, password, accountType }, "Failed to login");

        if (data.token) {
            await setToken(data.token);
        }
        return data;
    } catch (err) {
        console.error("login error:", err);
        throw err;
    }
}
