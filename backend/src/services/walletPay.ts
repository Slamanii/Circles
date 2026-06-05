import { TOKENS } from "../../../shared/constants";
import { treasuryWeb3Keypair } from "../mod/events";
import { supabase } from "./supabase";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY!;

type TokenKey = keyof typeof TOKENS;

// ticket_price is stored in NGN.
// cNGN is 1:1 with NGN — no conversion needed.
// For other tokens: derive NGN/USD from Jupiter cNGN price, then compute token amount.
async function getJupiterPrices(mints: string[]): Promise<Record<string, number>> {
    const res = await fetch(`https://price.jup.ag/v6/price?ids=${mints.join(",")}`);
    const { data } = await res.json() as { data: Record<string, { price: number }> };
    return Object.fromEntries(Object.entries(data).map(([mint, v]) => [mint, v.price]));
}

export async function getPaymentOptions(eventId: string, quantity: number) {
    const { data: event } = await supabase
        .from("events")
        .select("ticket_price, title")
        .eq("id", eventId)
        .single();

    if (!event) throw new Error("Event not found");

    const totalNgn = event.ticket_price * quantity;

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

    return { options, event, quantity };
}

export async function confirmWalletPurchase({
    userId,
    eventId,
    txSignature,
    tokenMint,
    quantity,
}: {
    userId: string;
    eventId: string;
    txSignature: string;
    tokenMint: string;
    quantity: number;
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

    // --- Verify treasury received the correct token and amount ---
    const { data: event } = await supabase
        .from("events")
        .select("ticket_price, group_id")
        .eq("id", eventId)
        .single();

    if (!event) throw new Error("Event not found");

    const totalNgn = event.ticket_price * quantity;
    const treasury = treasuryWeb3Keypair.publicKey.toBase58();
    const isNativeSol = tokenMint === TOKENS.solana.mint;

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

    if (isNativeSol) {
        const received = (txData.nativeTransfers ?? []).find(
            (t: any) => t.toUserAccount === treasury
        );
        // Allow 1% slippage tolerance
        if (!received || received.amount < expectedRaw * 0.99) {
            throw new Error("Insufficient SOL received by treasury");
        }
    } else {
        const received = (txData.tokenTransfers ?? []).find(
            (t: any) => t.toUserAccount === treasury && t.mint === tokenMint
        );
        if (!received || received.tokenAmount < expectedRaw * 0.99) {
            throw new Error("Insufficient token amount received by treasury");
        }
    }

    // --- Atomically reserve tickets ---
    const { data: reserved, error: reserveError } = await supabase
        .rpc("reserve_tickets", { p_event_id: eventId, p_quantity: quantity });

    if (reserveError) throw reserveError;
    if (!reserved || reserved.length < quantity) {
        throw new Error("Not enough tickets available");
    }

    const tickets = reserved as { id: string; asset_id: string }[];

    // --- Claim tickets ---
    await supabase
        .from("collectibles")
        .update({ owner_id: userId, custodian: "user", status: "active" })
        .in("id", tickets.map(t => t.id));

    // --- Log treasury transactions ---
    const { data: wallet } = await supabase
        .from("wallets")
        .select("address")
        .eq("user_id", userId)
        .maybeSingle();

    await supabase.from("tx_history").insert(
        tickets.map(t => ({
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

    return { success: true, ticketsClaimed: tickets.length };
}
