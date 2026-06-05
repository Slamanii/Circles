import axios from "axios";
import crypto from "crypto";
import { Request } from "express";
import { supabase } from "./supabase";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const MAX_TICKETS_PER_USER = 5;

export async function initiatePaystackPay({
    userId,
    eventId,
    quantity = 1,
}: {
    userId: string;
    eventId: string;
    quantity?: number;
}) {
    if (quantity < 1 || quantity > MAX_TICKETS_PER_USER) {
        throw new Error(`Quantity must be between 1 and ${MAX_TICKETS_PER_USER}`);
    }

    // Check how many tickets this user already owns for this event
    const { count: owned } = await supabase
        .from("collectibles")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("owner_id", userId);

    if ((owned ?? 0) + quantity > MAX_TICKETS_PER_USER) {
        throw new Error(`Would exceed the ${MAX_TICKETS_PER_USER} ticket limit for this event`);
    }

    const { data: event } = await supabase
        .from("events")
        .select("ticket_price")
        .eq("id", eventId)
        .single();

    if (!event) throw new Error("Event not found");

    const { data: user } = await supabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

    if (!user) throw new Error("User not found");

    // Atomically reserve `quantity` tickets using FOR UPDATE SKIP LOCKED
    const { data: reserved, error: reserveError } = await supabase
        .rpc("reserve_tickets", { p_event_id: eventId, p_quantity: quantity });

    if (reserveError) throw reserveError;
    if (!reserved || reserved.length < quantity) {
        throw new Error("Not enough tickets available");
    }

    const mintIds = (reserved as { id: string; asset_id: string }[]).map(r => r.id);
    const reference = `tickets_${mintIds[0]}_${Date.now()}`;

    try {
        const paystackRes = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {
                email: user.email,
                amount: event.ticket_price * quantity * 100,
                reference,
                metadata: {
                    mint_ids: mintIds,
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
            checkoutUrl: paystackRes.data.data.authorization_url,
            reference,
            quantity,
        };
    } catch (err) {
        // Release all reservations if Paystack init fails
        await supabase
            .from("collectibles")
            .update({ status: "pending" })
            .in("id", mintIds);
        throw err;
    }
}

export async function paystackWebhook(req: Request) {
    // Block forged webhook calls
    const signature = req.headers["x-paystack-signature"] as string;
    const hash = crypto
        .createHmac("sha512", PAYSTACK_SECRET)
        .update(JSON.stringify(req.body))
        .digest("hex");

    if (hash !== signature) throw new Error("Invalid webhook signature");

    const payload = req.body;
    if (payload.event !== "charge.success") return;

    const { mint_ids, user_id } = payload.data.metadata as {
        mint_ids: string[];
        user_id: string;
        event_id: string;
    };

    // Claim all reserved tickets — idempotent if webhook fires twice
    const { data: claimed } = await supabase
        .from("collectibles")
        .update({ owner_id: user_id, custodian: "user", status: "active" })
        .in("id", mint_ids)
        .eq("status", "reserved")
        .select("asset_id");

    if (!claimed?.length) return;

    const { data: wallet } = await supabase
        .from("wallets")
        .select("address")
        .eq("user_id", user_id)
        .maybeSingle();

    const txRows = claimed.map(c => ({
        wallet_role: "treasury",
        asset_id: c.asset_id,
        action: "purchase",
        to_wallet: wallet?.address ?? null,
    }));

    await supabase.from("tx_history").insert(txRows);
}
