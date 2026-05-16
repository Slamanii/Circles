import axios from "axios";
import { AuthRequest } from "../mod/auth";
import { supabase } from "./supabase";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

export async function initiatePaystackPay({
    userId,
    eventId,
}: {
    userId: string;
    eventId: string;
}) {
    const { data: event } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

    if (!event) throw new Error("Event not found");

    const { data: mintCopy } = await supabase
        .from("collectibles")
        .select("*")
        .eq("event_id", eventId)
        .eq("custodian", "treasury")
        .eq("status", "pending")
        .limit(1)
        .single();

    if (!mintCopy) throw new Error("Tickets sold out");

    const { data: user } = await supabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

    if (!user) throw new Error("User not found");

    const reference = `ticket_${mintCopy.id}_${Date.now()}`;

    const paystackres = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
            email: user.email,
            amount: event.ticket_price * 100,
            reference,
            metadata: {
                mint_id: mintCopy.id,
                asset_id: mintCopy.asset_id,
                user_id: userId,
                event_id: eventId,
            },
            callback_url: `${process.env.API_BASE_URL}/api/paystack-return`,
        },
        {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET}`,
                "Content-Type": "application/json",
            },
        }
    );

    return {
        checkoutUrl: paystackres.data.data.authorization_url,
        reference,
    };
}

export async function paystackWebhook(req: AuthRequest) {
    const event = req.body;

    if (event.event !== "charge.success") return;

    const { mint_id, user_id } = event.data.metadata;

    const { data: mintCopy } = await supabase
        .from("collectibles")
        .select("*")
        .eq("id", mint_id)
        .eq("custodian", "treasury")
        .eq("status", "pending")
        .single();

    if (!mintCopy) return; // already claimed or not found

    const { data: wallet } = await supabase
        .from("wallets")
        .select("address")
        .eq("user_id", user_id)
        .single();

    // Same custodial model as wallet pay: treasury retains on-chain ownership.
    // DB records logical ownership. On-chain delivery is opt-in via /export-ticket.
    await supabase
        .from("collectibles")
        .update({
            owner_id: user_id,
            custodian: "user",
            status: "active",
        })
        .eq("id", mint_id);

    await supabase.from("tx_history").insert({
        wallet_role: "treasury",
        asset_id: mintCopy.asset_id,
        action: "purchase",
        to_wallet: wallet?.address ?? null,
    });
}
