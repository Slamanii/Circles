import { supabase } from "./supabase";


export async function initiateWalletTransaction({
    userId,
    eventId,
}: {
    userId: string;
    eventId: string;
}) {
    const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

    if (eventError || !event) {
        throw new Error("Event not found");
    }

    const { data: mintCopy, error: mintError } = await supabase
        .from("collectibles")
        .select("*")
        .eq("event_id", eventId)
        .eq("custodian", "treasury")
        .eq("status", "pending")
        .limit(1)
        .single();

    if (mintError || !mintCopy) {
        throw new Error("Tickets sold out");
    }

    const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single();

    if (!wallet) throw new Error("Wallet not found");

    const { data: holding } = await supabase
        .from("wallet_holdings")
        .select("*")
        .eq("wallet_id", wallet.id)
        .eq("token_type", event.payment_token)
        .single();

    if (!holding || holding.balance < event.ticket_price) {
        throw new Error("Insufficient balance");
    }

    await supabase
        .from("wallet_holdings")
        .update({ balance: holding.balance - event.ticket_price })
        .eq("id", holding.id);

    await supabase.from("txHistory").insert({
        wallet_id: wallet.id,
        type: "buy",
        token_symbol: event.payment_token,
        amount: event.ticket_price,
        from_address: wallet.address,
        to_address: "TREASURY",
        status: "confirmed",
    });

    // Custodial model: treasury retains on-chain leaf ownership for all NFTs.
    // Ownership is tracked in the DB, allowing treasury to sign all transfers
    // (P2P sends, venue verifications) without user keypairs.
    // On-chain delivery to the user's wallet is a separate opt-in action via
    // POST /export-ticket when the user chooses to self-custody.
    const { data: updated } = await supabase
        .from("collectibles")
        .update({
            owner_id: userId,
            custodian: "user",
            status: "active",
        })
        .eq("id", mintCopy.id);

    if (!updated) throw new Error("Ticket not found");

    await supabase.from("tx_history").insert({
        wallet_role: "treasury",
        asset_id: mintCopy.asset_id,
        action: "purchase",
        to_wallet: wallet.address,
    });

    const { data: group } = await supabase.from("group_members").insert({
        group_id: event.group_id,
        userId: userId,
        role: "member",
    });

    return {
        success: true,
        updated,
        group,
    };
}
