import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function getAuthHeaders() {
    const token = await AsyncStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export type Collectible = {
    id: string;
    asset_id: string;
    tree_address: string;
    leaf_index: number;
    event_id: string;
    owner_id: string;
    custodian: "treasury" | "user";
    status: "pending" | "active" | "expired";
    qr_uri: string;
    events: {
        title: string;
        event_date: string;
        venue: string;
    } | null;
};

export async function fetchCollectibles(): Promise<Collectible[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/fetch-collectibles`, { headers });
    if (!res.ok) throw new Error("Failed to fetch collectibles");
    const data = await res.json();
    return data.collectibles;
}

/**
 * Returns the Helius proof for a cNFT the current user owns.
 * Use this on the frontend to build a Bubblegum transferV2 instruction
 * that the user signs with their mobile wallet for P2P ticket sends.
 */
export async function getTicketProof(assetId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/get-ticket-proof?assetId=${assetId}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch ticket proof");
    return res.json() as Promise<{ proof: any; collectible: Collectible }>;
}

export async function transferTicket(assetId: string, recipientUserId: string): Promise<{ txSignature: string }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/transfer-ticket`, {
        method: "POST",
        headers,
        body: JSON.stringify({ assetId, recipientUserId }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Transfer failed");
    }
    return res.json();
}

/**
 * Look up a user by exact username match, returns their id for use in transferTicket.
 */
export async function getUserByUsername(username: string): Promise<{ id: string } | null> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_URL}/api/search-users?q=${encodeURIComponent(username)}`, { headers });
    if (!res.ok) throw new Error("Failed to search users");
    const data = await res.json();
    const match = (data.users as any[]).find(
        (u) => u.username?.toLowerCase() === username.toLowerCase()
    );
    return match ?? null;
}
