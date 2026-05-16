import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function authHeaders() {
    const token = await AsyncStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function InitiateWalletTransaction(eventId: string) {
    try {
        const res = await fetch(`${API_URL}/api/initiate-wallet-tx`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({ eventId }),
        });
        if (!res.ok) throw new Error("Failed to initiate wallet transaction");
        return await res.json();
    } catch (err) {
        console.error("InitiateWalletTransaction error:", err);
    }
}

export async function initiatePaystackPay(eventId: string) {

    try {
        const res = await fetch(`${API_URL}/api/initiate-paystack`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({ eventId }),
        });
        if (!res.ok) throw new Error("Failed to initaite paystack transaction");
        return await res.json();
    } catch (err) {
        console.error("InitaiatePaystackPay error:", err);
    }
}

