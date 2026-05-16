import { supabase } from "../services/supabase";
import { getProofByleaf } from "./events";
import { transferCompressedNFT } from "../services/treasuryWallet/transferTicket";

export async function fetchUserCollectibles(userId: string) {
    const { data, error } = await supabase
        .from("collectibles")
        .select(`
            *,
            events(title, event_date, venue)
        `)
        .eq("owner_id", userId)
        .eq("custodian", "user")
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
}

export async function getCollectibleProof(assetId: string, userId: string) {
    const { data: collectible, error } = await supabase
        .from("collectibles")
        .select("*")
        .eq("asset_id", assetId)
        .eq("owner_id", userId)
        .single();

    if (error || !collectible) throw new Error("You do not own this ticket");

    const proof = await getProofByleaf(assetId);
    return { proof, collectible };
}

/**
 * P2P ticket transfer.
 *
 * Treasury is always the on-chain leaf owner (custodial model — NFTs are never
 * delivered to user wallets until the user opts into self-custody via /export-ticket).
 * This lets the treasury keypair sign all transfers without needing user private keys.
 */
export async function transferTicketP2P({
    assetId,
    senderUserId,
    recipientUserId,
}: {
    assetId: string;
    senderUserId: string;
    recipientUserId: string;
}) {
    const { data: collectible, error } = await supabase
        .from("collectibles")
        .select("*")
        .eq("asset_id", assetId)
        .eq("owner_id", senderUserId)
        .eq("custodian", "user")
        .eq("status", "active")
        .single();

    if (error || !collectible) throw new Error("You do not own this ticket");

    const { data: recipientWallet } = await supabase
        .from("wallets")
        .select("address")
        .eq("user_id", recipientUserId)
        .single();

    if (!recipientWallet) throw new Error("Recipient wallet not found");

    const proof = await getProofByleaf(assetId);

    // Treasury is the on-chain owner — it signs the transfer to the recipient's address.
    // DB ownership moves to recipientUserId; treasury remains the custodian on-chain.
    const txSignature = await transferCompressedNFT({
        treeAddress: collectible.tree_address,
        leafIndex: collectible.leaf_index,
        newOwner: recipientWallet.address,
        proof,
    });

    await supabase
        .from("collectibles")
        .update({ owner_id: recipientUserId })
        .eq("id", collectible.id);

    await supabase.from("tx_history").insert({
        wallet_role: "treasury",
        tx_signature: txSignature,
        asset_id: assetId,
        action: "transfer",
        from_wallet: senderUserId,
        to_wallet: recipientUserId,
    });

    return { txSignature };
}
