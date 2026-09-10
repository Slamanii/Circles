import { api } from "./apiClient";

export async function getPaymentOptions(eventId: string, quantity: number) {
    return api.post<{
        options: { key: string; symbol: string; mint: string; decimals: number; amount: number; rawAmount: number }[];
        event: { ticket_price: number; title: string };
        quantity: number;
    }>("/api/payment-options", { eventId, quantity }, "Failed to fetch payment options");
}

export async function confirmWalletPurchase(
    eventId: string,
    txSignature: string,
    tokenMint: string,
    quantity: number,
) {
    return api.post<{ success: boolean; ticketsClaimed: number }>(
        "/api/confirm-wallet-purchase",
        { eventId, txSignature, tokenMint, quantity },
        "Failed to confirm wallet purchase",
    );
}

export async function initiatePaystackPay(eventId: string, quantity: number) {
    try {
        return await api.post<{ checkoutUrl: string; reference: string; quantity: number }>(
            "/api/initiate-paystack",
            { eventId, quantity },
            "Failed to initiate paystack transaction",
        );
    } catch (err) {
        console.error("initiatePaystackPay error:", err);
        throw err;
    }
}
