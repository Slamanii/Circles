import { api } from "./apiClient";

export type Collectible = {
    id: string;
    asset_id: string;
    tree_address: string;
    leaf_index: number;
    event_id: string;
    owner_id: string;
    custodian: "treasury" | "user";
    status: "pending" | "active" | "expired";
    serial_number: number | null;
    qr_uri: string;
    events: {
        title: string;
        event_date: string;
        venue: string;
        flyer_card: string | null;
    } | null;
    tier: {
        name: string;
        price: number;
        info: string | null;
        sort_order: number;
    } | null;
};

export async function fetchCollectibles(): Promise<Collectible[]> {
    const data = await api.get<{ collectibles: Collectible[] }>("/api/fetch-collectibles", "Failed to fetch collectibles");
    return data.collectibles;
}

export async function fetchCollectibleById(id: string): Promise<Collectible> {
    const data = await api.get<{ collectible: Collectible }>(`/api/get-collectible?id=${id}`, "Failed to fetch ticket");
    return data.collectible;
}

/**
 * Returns the Helius proof for a cNFT the current user owns.
 * Use this on the frontend to build a Bubblegum transferV2 instruction
 * that the user signs with their mobile wallet for P2P ticket sends.
 */
export async function getTicketProof(assetId: string) {
    return api.get<{ proof: any; collectible: Collectible }>(
        `/api/get-ticket-proof?assetId=${assetId}`,
        "Failed to fetch ticket proof",
    );
}

export async function transferTicket(assetId: string, recipientUserId: string): Promise<{ txSignature: string }> {
    return api.post("/api/transfer-ticket", { assetId, recipientUserId }, "Transfer failed");
}

/**
 * Look up a user by exact username match, returns their id for use in transferTicket.
 */
export async function getUserByUsername(username: string): Promise<{ id: string } | null> {
    const data = await api.get<{ users: any[] }>(`/api/search-users?q=${encodeURIComponent(username)}`, "Failed to search users");
    const match = data.users.find(
        (u) => u.username?.toLowerCase() === username.toLowerCase()
    );
    return match ?? null;
}
