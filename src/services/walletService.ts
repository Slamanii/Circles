import { api } from "./apiClient";

export async function getPaymentOptions(eventId: string, tierId: string, quantity: number) {
    return api.post<{
        options: { key: string; symbol: string; mint: string; decimals: number; amount: number; rawAmount: number }[];
        tier: { price: number; name: string };
        quantity: number;
        requestedQuantity: number;
        adjusted: boolean;
    }>("/api/payment-options", { eventId, tierId, quantity }, "Failed to fetch payment options");
}

export async function confirmWalletPurchase(
    eventId: string,
    tierId: string,
    txSignature: string,
    tokenMint: string,
) {
    return api.post<{ success: boolean; ticketsClaimed: number }>(
        "/api/confirm-wallet-purchase",
        { eventId, tierId, txSignature, tokenMint },
        "Failed to confirm wallet purchase",
    );
}

export async function initiatePaystackPay(eventId: string, tierId: string, quantity: number) {
    try {
        return await api.post<{ checkoutUrl: string; reference: string; quantity: number }>(
            "/api/initiate-paystack",
            { eventId, tierId, quantity },
            "Failed to initiate paystack transaction",
        );
    } catch (err) {
        console.error("initiatePaystackPay error:", err);
        throw err;
    }
}
