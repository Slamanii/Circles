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
 * DB-only ticket transfer for the Collectibles screen's "send to a friend"
 * feature. No on-chain call — the treasury remains the leaf owner exactly as
 * after purchase; only the collectible's owner_id record moves. This matches
 * the intent of that flow (sending a ticket to someone attending the same
 * event) without the cost/latency of a real on-chain transfer.
 */
export async function transferTicketInApp({
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

    const { data: recipient } = await supabase
        .from("users")
        .select("id")
        .eq("id", recipientUserId)
        .single();

    if (!recipient) throw new Error("Recipient not found");

    await supabase
        .from("collectibles")
        .update({ owner_id: recipientUserId })
        .eq("id", collectible.id);

    return { transferred: true };
}

/**
 * Real on-chain P2P ticket transfer — treasury signs the leaf over to the
 * recipient's own platform custodial wallet address, so the recipient becomes
 * the genuine on-chain owner (no longer treasury-held/signed). Not currently
 * wired to any route — the Collectibles screen uses transferTicketInApp
 * above instead. Reserved for a future wallet-level "send this NFT" feature
 * for users who want to hold/trade the ticket as an off-platform asset.
 */
export async function transferTicketP2P({
    assetId,
    senderUserId,
    recipientAddress,
}: {
    assetId: string;
    senderUserId: string;
    recipientAddress: string;
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

    const proof = await getProofByleaf(assetId);

    // Treasury signs this transfer, but the leaf owner genuinely moves to the
    // recipient's own wallet address — treasury no longer holds/controls it.
    const txSignature = await transferCompressedNFT({
        treeAddress: collectible.tree_address,
        leafIndex: collectible.leaf_index,
        newOwner: recipientAddress,
        proof,
    });

    // recipientAddress may or may not belong to a platform user — resolve it
    // so the ticket still shows up in their Collectibles list if it does.
    // If not, this is a genuine off-platform transfer: owner_id is null and
    // custodian moves off "treasury"/"user" so burn/collectibles queries
    // (which key on those) correctly leave this ticket alone.
    const { data: recipientWallet } = await supabase
        .from("wallets")
        .select("user_id")
        .eq("address", recipientAddress)
        .maybeSingle();

    await supabase
        .from("collectibles")
        .update({
            owner_id: recipientWallet?.user_id ?? null,
            owner_address: recipientAddress,
            custodian: recipientWallet ? "user" : "external",
        })
        .eq("id", collectible.id);

    await supabase.from("tx_history").insert({
        wallet_role: "treasury",
        tx_signature: txSignature,
        asset_id: assetId,
        action: "transfer",
        from_wallet: senderUserId,
        to_wallet: recipientWallet?.user_id ?? recipientAddress,
    });

    return { txSignature };
}
