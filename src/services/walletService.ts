import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function authHeaders() {
    const token = await AsyncStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function getPaymentOptions(eventId: string, quantity: number) {
    const res = await fetch(`${API_URL}/api/payment-options`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ eventId, quantity }),
    });
    if (!res.ok) throw new Error("Failed to fetch payment options");
    return await res.json() as {
        options: { key: string; symbol: string; mint: string; decimals: number; amount: number; rawAmount: number }[];
        event: { ticket_price: number; title: string };
        quantity: number;
    };
}

export async function confirmWalletPurchase(
    eventId: string,
    txSignature: string,
    tokenMint: string,
    quantity: number,
) {
    const res = await fetch(`${API_URL}/api/confirm-wallet-purchase`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ eventId, txSignature, tokenMint, quantity }),
    });
    if (!res.ok) throw new Error("Failed to confirm wallet purchase");
    return await res.json() as { success: boolean; ticketsClaimed: number };
}

export async function initiatePaystackPay(eventId: string, quantity: number) {
    try {
        const res = await fetch(`${API_URL}/api/initiate-paystack`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({ eventId, quantity }),
        });
        if (!res.ok) throw new Error("Failed to initiate paystack transaction");
        return await res.json() as { checkoutUrl: string; reference: string; quantity: number };
    } catch (err) {
        console.error("initiatePaystackPay error:", err);
    }
}

