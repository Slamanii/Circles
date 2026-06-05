import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const HELIUS_RPC_URL = process.env.EXPO_PUBLIC_HELIUS_RPC_URL!;

async function authHeaders() {
    const token = await AsyncStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

// ── Treasury endpoints (admin use) ──────────────────────────────────────────

export async function fetchTreasuryTxHistoryService(limit: number = 50, offset: number = 0) {
    const res = await fetch(
        `${API_URL}/api/fetch-treasury-tx?limit=${limit}&offset=${offset}`,
        { headers: await authHeaders() }
    );
    if (!res.ok) throw new Error("Failed to fetch treasury transaction history");
    return res.json();
}

export async function fetchTxHistoryOnchainService(limit: number = 20) {
    const res = await fetch(
        `${API_URL}/api/fetch-treasury-tx-onchain?limit=${limit}`,
        { headers: await authHeaders() }
    );
    if (!res.ok) throw new Error("Failed to fetch onchain treasury transactions");
    return res.json();
}

export async function fetchTreasuryTxHistory(limit: number = 50, offset: number = 0) {
    const { data, error } = await supabase
        .from("tx_history")
        .select("id, tx_signature, action, asset_id, from_wallet, to_wallet, status, created_at")
        .eq("wallet_role", "treasury")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
}

// ── User wallet history (on-chain via Helius) ────────────────────────────────

export type ParsedTx = {
    signature: string;
    type: string;
    timestamp: number;
    fee: number;
    amount?: number;
    token?: string;
    from?: string;
    to?: string;
};

/**
 * Fetches parsed transaction history for a wallet address via Helius.
 * Returns the most recent `limit` transactions directly from chain.
 */
export async function fetchWalletTxHistory(
    walletAddress: string,
    limit: number = 50
): Promise<ParsedTx[]> {
    const res = await fetch(HELIUS_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: "tx-history",
            method: "getSignaturesForAddress",
            params: [walletAddress, { limit }],
        }),
    });

    if (!res.ok) throw new Error("Failed to fetch transaction history");
    const data = await res.json();

    return (data.result ?? []).map((tx: any) => ({
        signature: tx.signature,
        type: tx.type ?? "UNKNOWN",
        timestamp: tx.blockTime ?? 0,
        fee: tx.fee ?? 0,
        amount: tx.nativeTransfers?.[0]?.amount,
        token: tx.tokenTransfers?.[0]?.mint,
        from: tx.nativeTransfers?.[0]?.fromUserAccount,
        to: tx.nativeTransfers?.[0]?.toUserAccount,
    }));
}
