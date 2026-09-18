import { api } from "../apiClient";
import { supabase } from "../supabase";


export async function fetchTreasuryTxHistoryService(limit: number = 50, offset: number = 0) {
    return api.get(
        `/api/fetch-treasury-tx?limit=${limit}&offset=${offset}`,
        "Failed to fetch treasury transaction history",
    );
}

export async function fetchTxHistoryOnchainService(limit: number = 20) {
    return api.get(
        `/api/fetch-treasury-tx-onchain?limit=${limit}`,
        "Failed to fetch onchain treasury transactions",
    );
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
 * Fetches parsed transaction history for a wallet address, proxied through
 * the backend (keeps HELIUS_API_KEY server-side; the enhanced parsed-tx
 * data this needs isn't available from a plain RPC call anyway).
 */
export async function fetchWalletTxHistory(
    walletAddress: string,
    limit: number = 50
): Promise<ParsedTx[]> {
    return api.get<ParsedTx[]>(
        `/api/fetch-wallet-tx-onchain?address=${encodeURIComponent(walletAddress)}&limit=${limit}`,
        "Failed to fetch transaction history",
    );
}
