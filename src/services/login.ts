import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function walletLogin(walletAddress: string, signature: string, message: string) {
    try {
        const res = await fetch(`${API_URL}/api/wallet-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress, signature, message }),
        });
        if (!res.ok) throw new Error("Wallet login failed");
        const data = await res.json();
        if (data.token) {
            await AsyncStorage.setItem("token", data.token);
        }
        return data;
    } catch (err) {
        console.error("walletLogin error:", err);
        throw err;
    }
}

export async function Login(email: string, password: string) {

    try {
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

    if (!res.ok) {
            throw new Error("Failed to login");
        }

        const data = await res.json();

        if (data.token) {
            await AsyncStorage.setItem("token", data.token);
        }
        return data;
    } catch (err) {
        console.error("login error:", err);
        throw err;
    }
}
