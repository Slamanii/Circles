import axios from "axios";
import crypto from "crypto";
import { Request } from "express";
import { supabase } from "./supabase";
import { notifyUser } from "./realtime";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const MAX_TICKETS_PER_USER = 5;

export async function initiatePaystackPay({
    userId,
    eventId,
    tierId,
    quantity = 1,
}: {
    userId: string;
    eventId: string;
    tierId: string;
    quantity?: number;
}) {
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_TICKETS_PER_USER) {
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

    const { data: tier } = await supabase
        .from("ticket_tiers")
        .select("price")
        .eq("id", tierId)
        .eq("event_id", eventId)
        .single();

    if (!tier) throw new Error("Ticket tier not found");

    const { data: user } = await supabase
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

    if (!user) throw new Error("User not found");

    // Atomically reserve `quantity` tickets using FOR UPDATE SKIP LOCKED
    const { data: reserved, error: reserveError } = await supabase
        .rpc("reserve_tickets", { p_event_id: eventId, p_quantity: quantity, p_user_id: userId, p_tier_id: tierId });

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
                amount: tier.price * quantity * 100,
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
            .update({ status: "pending", owner_id: null, reserved_at: null })
            .in("id", mintIds);
        throw err;
    }
}

export async function paystackWebhook(req: Request & { rawBody?: Buffer }) {
    // Block forged webhook calls — verified against the raw request bytes,
    // since re-serializing req.body can drift from what Paystack actually signed
    const signature = req.headers["x-paystack-signature"] as string;
    if (!req.rawBody) throw new Error("Missing raw body for webhook verification");

    const hash = crypto
        .createHmac("sha512", PAYSTACK_SECRET)
        .update(req.rawBody)
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

    await notifyUser(user_id, {
        type: "collectible_purchase_confirmed",
        body: `You claimed ${claimed.length} ticket(s)`,
        reference_type: "event",
    });
}
