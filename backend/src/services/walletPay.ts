import {
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
    createTransferInstruction,
    getAssociatedTokenAddressSync,
    getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { TOKENS } from "../../../shared/constants";
import { CONNECTION, treasuryWeb3Keypair } from "../mod/events";
import { supabase } from "./supabase";
import { notifyUser } from "./realtime";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY!;
const MAX_TICKETS_PER_USER = 5;

type TokenKey = keyof typeof TOKENS;

// ticket_price is stored in NGN.
// cNGN is 1:1 with NGN — no conversion needed.
// For other tokens: derive NGN/USD from Jupiter cNGN price, then compute token amount.
async function getJupiterPrices(mints: string[]): Promise<Record<string, number>> {
    const res = await fetch(`https://price.jup.ag/v6/price?ids=${mints.join(",")}`);
    const { data } = await res.json() as { data: Record<string, { price: number }> };
    return Object.fromEntries(Object.entries(data).map(([mint, v]) => [mint, v.price]));
}

// Sends back exactly what was received by the treasury for a payment whose
// reservation lapsed before it could be claimed — the payment is irreversible
// on-chain by the time this runs, so this is the only way to make the buyer whole.
async function refundTreasuryPayment({
    tokenMint,
    rawAmount,
    destination,
}: {
    tokenMint: string;
    rawAmount: number;
    destination: string;
}): Promise<string> {
    const destPubkey = new PublicKey(destination);
    const isNativeSol = tokenMint === TOKENS.solana.mint;

    if (isNativeSol) {
        const tx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: treasuryWeb3Keypair.publicKey,
                toPubkey: destPubkey,
                lamports: rawAmount,
            }),
        );
        return sendAndConfirmTransaction(CONNECTION, tx, [treasuryWeb3Keypair]);
    }

    const mintPubkey = new PublicKey(tokenMint);
    const fromAta = getAssociatedTokenAddressSync(mintPubkey, treasuryWeb3Keypair.publicKey);
    // Recipient may not have an associated token account for this mint yet — treasury pays the rent.
    const toAccount = await getOrCreateAssociatedTokenAccount(
        CONNECTION, treasuryWeb3Keypair, mintPubkey, destPubkey,
    );
    const tx = new Transaction().add(
        createTransferInstruction(fromAta, toAccount.address, treasuryWeb3Keypair.publicKey, rawAmount),
    );
    return sendAndConfirmTransaction(CONNECTION, tx, [treasuryWeb3Keypair]);
}

export async function getPaymentOptions(eventId: string, tierId: string, quantity: number, userId: string) {
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_TICKETS_PER_USER) {
        throw new Error(`Quantity must be between 1 and ${MAX_TICKETS_PER_USER}`);
    }

    // Check how many tickets this user already owns or has reserved for this event
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
        .select("price, name")
        .eq("id", tierId)
        .eq("event_id", eventId)
        .single();

    if (!tier) throw new Error("Ticket tier not found");

    // --- Reserve now, before any payment — closes the sold-out-after-payment race ---
    const { data: reserved, error: reserveError } = await supabase
        .rpc("reserve_tickets", { p_event_id: eventId, p_quantity: quantity, p_user_id: userId, p_tier_id: tierId });

    if (reserveError) throw reserveError;
    if (!reserved || reserved.length === 0) throw new Error("Event sold out");

    // Fewer than asked were available — gracefully quote for what's actually reserved
    // instead of failing outright. The frontend should use `quantity` (not the
    // original request) for both the payment amount and the follow-up confirm call.
    const adjustedQuantity = reserved.length;
    const totalNgn = tier.price * adjustedQuantity;

    const allMints = Object.values(TOKENS).map(t => t.mint);
    const prices = await getJupiterPrices(allMints);

    // cNGN price in USD gives us the NGN→USD rate (1 cNGN ≈ 1 NGN)
    const cngnUsdPrice = prices[TOKENS.cngn.mint];
    if (!cngnUsdPrice) throw new Error("Could not fetch NGN rate");
    const totalUsd = totalNgn * cngnUsdPrice;

    const options = (Object.entries(TOKENS) as [TokenKey, typeof TOKENS[TokenKey]][]).map(
        ([key, token]) => {
            let amount: number;
            if (key === "cngn") {
                // Direct 1:1 — no conversion
                amount = totalNgn;
            } else {
                const tokenUsdPrice = prices[token.mint];
                if (!tokenUsdPrice) return null;
                amount = totalUsd / tokenUsdPrice;
            }
            return {
                key,
                symbol: token.symbol,
                mint: token.mint,
                decimals: token.decimals,
                amount: parseFloat(amount.toFixed(6)),
                rawAmount: Math.ceil(amount * 10 ** token.decimals),
                totalNgn,
            };
        }
    ).filter(Boolean);

    return {
        options,
        tier,
        quantity: adjustedQuantity,
        requestedQuantity: quantity,
        adjusted: adjustedQuantity !== quantity,
    };
}

export async function confirmWalletPurchase({
    userId,
    eventId,
    tierId,
    txSignature,
    tokenMint,
}: {
    userId: string;
    eventId: string;
    tierId: string;
    txSignature: string;
    tokenMint: string;
}) {
    const token = Object.values(TOKENS).find(t => t.mint === tokenMint);
    if (!token) throw new Error("Unsupported token");

    // --- Verify the on-chain transaction via Helius enhanced transactions API ---
    // Retry up to 5 times with 2s gaps — Helius indexing can lag 1-3s after confirmation
    let txData: any;
    for (let attempt = 0; attempt < 5; attempt++) {
        const heliusRes = await fetch(
            `https://api.helius.xyz/v0/transactions?api-key=${HELIUS_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transactions: [txSignature] }),
            }
        );
        const [result] = await heliusRes.json() as any[];
        if (result) { txData = result; break; }
        if (attempt < 4) await new Promise(r => setTimeout(r, 2000));
    }

    if (!txData) throw new Error("Transaction not found — try again in a moment");
    if (txData.transactionError) throw new Error("Transaction failed on-chain");

    // Replay protection — reject transactions older than 5 minutes
    if (Date.now() / 1000 - txData.timestamp > 300) {
        throw new Error("Transaction too old");
    }

    const treasury = treasuryWeb3Keypair.publicKey.toBase58();
    const isNativeSol = tokenMint === TOKENS.solana.mint;

    // What actually landed at treasury from this signature — used both to verify
    // the purchase amount, and, if the reservation has lapsed, to refund exactly
    // what was received.
    let receivedRaw: number;
    let payerAddress: string;
    if (isNativeSol) {
        const received = (txData.nativeTransfers ?? []).find(
            (t: any) => t.toUserAccount === treasury
        );
        if (!received) throw new Error("No payment found in this transaction");
        receivedRaw = received.amount;
        payerAddress = received.fromUserAccount;
    } else {
        const received = (txData.tokenTransfers ?? []).find(
            (t: any) => t.toUserAccount === treasury && t.mint === tokenMint
        );
        if (!received) throw new Error("No payment found in this transaction");
        receivedRaw = received.tokenAmount;
        payerAddress = received.fromUserAccount;
    }

    // --- Claim this signature so it can't be redeemed for tickets twice ---
    // The insert itself is the atomic claim: a replay (or a concurrent double-submit
    // of the same signature) hits the primary key and fails here, before anything else happens.
    const { error: claimError } = await supabase
        .from("wallet_purchase_claims")
        .insert({ tx_signature: txSignature, event_id: eventId, user_id: userId });

    if (claimError) {
        if (claimError.code === "23505") throw new Error("Transaction already used");
        throw claimError;
    }

    // --- Look up the tickets reserved for this user during getPaymentOptions ---
    const { data: reservedRows, error: reservedError } = await supabase
        .from("collectibles")
        .select("id, asset_id")
        .eq("event_id", eventId)
        .eq("owner_id", userId)
        .eq("tier_id", tierId)
        .eq("status", "reserved");

    if (reservedError) throw reservedError;

    if (!reservedRows || reservedRows.length === 0) {
        // Reservation lapsed (>5 min between quote and payment landing) but the
        // payment is real and irreversible — refund it rather than keep it.
        try {
            const refundSignature = await refundTreasuryPayment({
                tokenMint, rawAmount: receivedRaw, destination: payerAddress,
            });
            await supabase.from("tx_history").insert({
                wallet_role: "treasury",
                tx_signature: refundSignature,
                action: "refund",
                to_wallet: payerAddress,
            });
            await notifyUser(userId, {
                type: "wallet_reservation_refunded",
                body: "Your reservation expired and your payment was refunded",
                reference_id: eventId,
                reference_type: "event",
                metadata: { eventId },
            }).catch(console.error);
        } catch (refundErr) {
            console.error(
                `REFUND FAILED — treasury owes ${receivedRaw} of ${tokenMint} to ${payerAddress} ` +
                `(original tx ${txSignature}, event ${eventId}, user ${userId}):`,
                refundErr,
            );
            throw new Error(
                "Your reservation expired and the automatic refund failed — please contact support " +
                `with this reference: ${txSignature}`
            );
        }
        throw new Error("Your reservation expired before payment was confirmed — you've been refunded");
    }

    const quantity = reservedRows.length;

    // --- Verify the amount received matches this tier's price for the reserved quantity ---
    const { data: event } = await supabase
        .from("events")
        .select("group_id")
        .eq("id", eventId)
        .single();

    if (!event) throw new Error("Event not found");

    const { data: tier } = await supabase
        .from("ticket_tiers")
        .select("price")
        .eq("id", tierId)
        .eq("event_id", eventId)
        .single();

    if (!tier) throw new Error("Ticket tier not found");

    const totalNgn = tier.price * quantity;
    let expectedRaw: number;
    if (token === TOKENS.cngn) {
        expectedRaw = Math.ceil(totalNgn * 10 ** token.decimals);
    } else {
        const prices = await getJupiterPrices([TOKENS.cngn.mint, tokenMint]);
        const cngnUsd = prices[TOKENS.cngn.mint];
        const tokenUsd = prices[tokenMint];
        if (!cngnUsd || !tokenUsd) throw new Error("Could not fetch exchange rates");
        const totalUsd = totalNgn * cngnUsd;
        expectedRaw = Math.ceil((totalUsd / tokenUsd) * 10 ** token.decimals);
    }

    // Allow 1% slippage tolerance
    if (receivedRaw < expectedRaw * 0.99) {
        throw new Error("Insufficient payment received by treasury");
    }

    // --- Claim the already-reserved tickets (owner_id was set at reservation time) ---
    await supabase
        .from("collectibles")
        .update({ custodian: "user", status: "active" })
        .in("id", reservedRows.map(t => t.id));

    // --- Log treasury transactions ---
    const { data: wallet } = await supabase
        .from("wallets")
        .select("address")
        .eq("user_id", userId)
        .maybeSingle();

    await supabase.from("tx_history").insert(
        reservedRows.map(t => ({
            wallet_role: "treasury",
            asset_id: t.asset_id,
            tx_signature: txSignature,
            action: "purchase",
            to_wallet: wallet?.address ?? null,
        }))
    );

    // --- Add buyer to event group chat ---
    await supabase
        .from("group_members")
        .upsert(
            { group_id: event.group_id, user_id: userId, role: "member" },
            { onConflict: "group_id,user_id" }
        );

    await notifyUser(userId, {
        type: "collectible_purchase_confirmed",
        body: `You claimed ${reservedRows.length} ticket(s)`,
        reference_id: eventId,
        reference_type: "event",
        metadata: { eventId },
    });

    return { success: true, ticketsClaimed: reservedRows.length };
}
