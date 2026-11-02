import { supabase } from "../services/supabase";
import { getProofByleaf } from "./events";
import { transferCompressedNFT } from "../services/treasuryWallet/transferTicket";
import { notifyUser } from "../services/realtime";

export async function fetchUserCollectibles(userId: string) {
    const { data, error } = await supabase
        .from("collectibles")
        .select(`
            *,
            events(title, event_date, venue, flyer_card, status, cancellation_notice),
            tier:ticket_tiers(name, price, info, sort_order, group_ticket, free)
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

export async function getCollectibleById(id: string, userId: string) {
    const { data: collectible, error } = await supabase
        .from("collectibles")
        .select("*, events(title, event_date, venue, flyer_card, status, cancellation_notice), tier:ticket_tiers(name, price, info, sort_order, group_ticket, free)")
        .eq("id", id)
        .eq("owner_id", userId)
        .single();

    if (error || !collectible) throw new Error("You do not own this ticket");
    return collectible;
}

// Checked by the creator or anyone they granted scan access to (see
// grantScanAccess in mod/events.ts). One scan admits the whole group when the
// tier is a group ticket — there's no separate per-head counting.
export async function validateTicket(eventId: string, scannerUserId: string, assetId: string) {
    const { data: event, error: eventError } = await supabase
        .from("events")
        .select("creator_id, status")
        .eq("id", eventId)
        .single();

    if (eventError || !event) throw new Error("Event not found");

    let authorized = event.creator_id === scannerUserId;
    if (!authorized) {
        const { data: grant } = await supabase
            .from("event_scan_grants")
            .select("id")
            .eq("event_id", eventId)
            .eq("user_id", scannerUserId)
            .maybeSingle();
        authorized = !!grant;
    }
    if (!authorized) throw new Error("You don't have scan access for this event");
    if (event.status === "cancelled") throw new Error("This event has been cancelled");

    const { data: collectible, error: collectibleError } = await supabase
        .from("collectibles")
        .select("id, status, checked_in_at, tier:ticket_tiers(name, group_ticket)")
        .eq("event_id", eventId)
        .eq("asset_id", assetId)
        .single();

    if (collectibleError || !collectible) throw new Error("Ticket not found for this event");
    if (collectible.status !== "active") throw new Error("This ticket was never purchased");
    if (collectible.checked_in_at) throw new Error("Ticket already checked in");

    const { error: updateError } = await supabase
        .from("collectibles")
        .update({ checked_in_at: new Date().toISOString() })
        .eq("id", collectible.id);

    if (updateError) throw updateError;

    const tier = collectible.tier as unknown as { name: string; group_ticket: number | null } | null;
    return { success: true, tierName: tier?.name ?? null, groupSize: tier?.group_ticket ?? null };
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
        .select("*, events(title)")
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

    await notifyUser(recipientUserId, {
        type: "collectible_received",
        body: `You received a ticket for "${collectible.events?.title}"`,
        reference_id: collectible.id,
        reference_type: "collectible",
        metadata: { ticketId: collectible.id },
    });

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
