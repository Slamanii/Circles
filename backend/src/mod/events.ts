import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey
} from "@solana/web3.js";
import BN from "bn.js";
import fs from "fs";
import { burn, mplBubblegum } from "@metaplex-foundation/mpl-bubblegum";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity, publicKey as umiPublicKey } from "@metaplex-foundation/umi";
import IDL from "../../../target/idl/ticket_program.json";
import { TicketProgram } from "../../../target/types/ticket_program";
import bs58 from "bs58";
import { supabase } from "../services/supabase";
import { createGroupChat } from "./chat";
import { notifyUser } from "../services/realtime";

export const CONNECTION = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID!); 


const BUBBLEGUM_PROGRAM_ID = new PublicKey("BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY");
const SPL_COMPRESSION_ID = new PublicKey("cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK");
const SPL_NOOP_ID = new PublicKey("noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV");

const secret = JSON.parse(
    fs.readFileSync("./treasury-keypair.json", "utf8")
)
export const treasuryWeb3Keypair = Keypair.fromSecretKey(
    new Uint8Array(secret)
);

function getProgram(): Program<TicketProgram> {
  const wallet = new Wallet(treasuryWeb3Keypair);
  const provider = new AnchorProvider(CONNECTION, wallet, {
    commitment: "confirmed",
  });
  return new Program<TicketProgram>(IDL as any, provider);
}

export async function initializeEventOnchain({
  eventId,
  title,
  maxSupply,
}: {
  eventId: string;
  title: string;
  maxSupply: number;
}): Promise<string> {

  const program = getProgram();

  // URI points to a metadata endpoint that must be implemented:
  // GET /api/events/:eventId/metadata.json → { name, symbol, image, description }
  // This is used by explorers and wallets to display the NFT.
  const metadataUri = `${process.env.API_BASE_URL}/api/events/${eventId}/metadata.json`;

  const [eventPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("event"), Buffer.from(eventId)],
    PROGRAM_ID,
  );

  const tx = await program.methods
    .createEvent(
      title,
      "TKT",
      metadataUri,
      new BN(maxSupply),
      eventId,
    )
    .accounts({
      authority: treasuryWeb3Keypair.publicKey,
      event: eventPda,
    } as any)
    .signers([treasuryWeb3Keypair])
    .rpc();

    return tx;
}

 type TierInput = { name: string; price: number; supply: number; info?: string };

 export async function createEvent(userId: string, data: any) {

    const {
        title,
        description,
        tiers,
        eventDate,
        venue,
        flyerCard,
        creatorName,
    } = data as { tiers: TierInput[] } & Record<string, any>;

    if (!Array.isArray(tiers) || tiers.length === 0) {
        throw new Error("At least one ticket tier is required");
    }
    for (const tier of tiers) {
        if (!tier.name || typeof tier.name !== "string") {
            throw new Error("Every tier requires a name");
        }
        if (!(tier.price > 0)) throw new Error(`Tier "${tier.name}" needs a price greater than 0`);
        if (!(tier.supply > 0)) throw new Error(`Tier "${tier.name}" needs a supply greater than 0`);
    }

    const ticketSupply = tiers.reduce((sum, t) => sum + t.supply, 0);
    const ticketPrice = Math.min(...tiers.map(t => t.price));

    // 1. Insert event without group_id (group doesn't exist yet). ticket_supply/
    // ticket_price are now the aggregate total capacity / starting price.
    const { data: event, error } = await supabase
        .from("events")
        .insert({
            title,
            description,
            venue,
            flyer_card: flyerCard ?? null,
            creator_id: userId,
            ticket_supply: ticketSupply,
            ticket_price: ticketPrice,
            event_date: eventDate,
        })
        .select()
        .single();

    if (error) throw error;

    // 2. Insert the tiers — creator's submitted order becomes sort_order. If
    // this fails, compensate by deleting the just-inserted event rather than
    // wrapping in a DB transaction (createEvent is already a sequential,
    // non-transactional series of steps); an event with zero tiers would
    // otherwise be silently unsellable since reservation always needs a tier_id.
    const { data: insertedTiers, error: tiersError } = await supabase
        .from("ticket_tiers")
        .insert(tiers.map((t, i) => ({
            event_id: event.id,
            name: t.name,
            price: t.price,
            supply: t.supply,
            info: t.info ?? null,
            sort_order: i,
        })))
        .select();

    if (tiersError) {
        await supabase.from("events").delete().eq("id", event.id);
        throw tiersError;
    }

    // 3. Create group chat for the event
    const group = await createGroupChat(userId, creatorName ?? title, event.id);

    // 4. Back-fill group_id on the event row
    await supabase
        .from("events")
        .update({ group_id: group.id })
        .eq("id", event.id);

    // 5. Initialize on-chain event with real metadata
    const onChainTx = await initializeEventOnchain({
        eventId: event.id,
        title,
        maxSupply: ticketSupply,
    });

    // 6. Kick off cNFT minting into treasury in the background — not awaited,
    // so this request doesn't block for the full mint duration. Resumable via
    // runMintJob's atomic claim if the process crashes mid-run.
    runMintJob(event.id);

    return {
        event: { ...event, group_id: group.id, tiers: insertedTiers },
        group,
        onChainTx,
        mint: { status: "queued" },
    };
 }

type TierBoundary = { id: string; name: string; upTo: number };

// Cumulative supply boundaries in sort_order, e.g. tiers [VIP++:20, VIP:50,
// Base:200] -> serials 1-20 = VIP++, 21-70 = VIP, 71-270 = Base.
function resolveTierForSerial(boundaries: TierBoundary[], serialNumber: number): TierBoundary {
    const tier = boundaries.find(b => serialNumber <= b.upTo);
    if (!tier) throw new Error(`No tier covers serial number ${serialNumber}`);
    return tier;
}

async function mintOneCnft(eventId: string, tierBoundaries: TierBoundary[]) {
    const program = getProgram();

    const [globalStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("global_state")], PROGRAM_ID
    );
    const globalState = await program.account.globalState.fetch(globalStatePda);
    const merkleTree = new PublicKey(globalState.currentTree);

    const [eventPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("event"), Buffer.from(eventId)], PROGRAM_ID
    );
    const eventAccount = await program.account.event.fetch(eventPda);

    if (eventAccount.minted.toNumber() >= eventAccount.maxSupply.toNumber()) {
        throw new Error("Event sold out");
    }

    const mintedInTree = globalState.mintedInCurrentTree.toNumber();
    const maxLeaves = Math.pow(2, globalState.maxDepth);

    if (mintedInTree >= maxLeaves) throw new Error("TREE_FULL");

    const serialNumber = eventAccount.minted.toNumber() + 1;
    const leafIndex = mintedInTree;
    const tier = resolveTierForSerial(tierBoundaries, serialNumber);

    const metadata = {
        name: `${tier.name} Ticket #${serialNumber}`,
        symbol: "TKT",
        uri: `${process.env.API_BASE_URL}/api/events/${eventId}/tickets/${serialNumber}`,
    };

    const [assetId] = PublicKey.findProgramAddressSync(
        [Buffer.from("asset"), merkleTree.toBytes(), new BN(leafIndex).toArrayLike(Buffer, "le", 8)],
        BUBBLEGUM_PROGRAM_ID
    );

    const tx = await program.methods
        .mintCnft(metadata)
        .accounts({
            payer: treasuryWeb3Keypair.publicKey,
            owner: treasuryWeb3Keypair.publicKey,
            merkleTree,
            event: eventPda,
            delegate: treasuryWeb3Keypair.publicKey,
            bubblegumProgram: BUBBLEGUM_PROGRAM_ID,
            compressionProgram: SPL_COMPRESSION_ID,
            logWrapper: SPL_NOOP_ID,
        })
        .signers([treasuryWeb3Keypair])
        .rpc();

    await supabase.from("collectibles").insert({
        event_id: eventId,
        asset_id: assetId.toBase58(),
        tree_address: merkleTree.toBase58(),
        leaf_index: leafIndex,
        serial_number: serialNumber,
        owner_address: treasuryWeb3Keypair.publicKey.toBase58(),
        tx_signature: tx,
        metadata_uri: metadata.uri,
        tier_id: tier.id,
        status: "pending",
    });

    return { assetId: assetId.toBase58(), leafIndex, txSignature: tx };
}

export async function mintTickets({ eventId }: { eventId: string }) {
    const results = [];

    const { data: tiers, error: tiersError } = await supabase
        .from("ticket_tiers")
        .select("id, name, supply")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });

    if (tiersError) throw tiersError;
    if (!tiers || tiers.length === 0) throw new Error(`No ticket tiers found for event ${eventId}`);

    let cumulative = 0;
    const tierBoundaries: TierBoundary[] = tiers.map(t => {
        cumulative += t.supply;
        return { id: t.id, name: t.name, upTo: cumulative };
    });

    while (true) {
        try {
            results.push(await mintOneCnft(eventId, tierBoundaries));
        } catch (err) {
            const e = err as { message?: string; logs?: string[] };
            if (e.message?.includes("Event sold out")) {
                break;
            }
            if (e.message?.includes("TREE_FULL") || e.logs?.some((l) => l.includes("TreeFull"))) {
                await createNewTree();
                continue;
            }
            throw err;
        }
    }

    return results;
}

/**
 * Fire-and-forget: claims the event's mint job via the atomic `claim_event_mint`
 * RPC (a no-op if another run already owns it, or it's already completed) and
 * runs `mintTickets` to completion, persisting the outcome. Never awaited by
 * callers — detaches minting from the HTTP request lifecycle. Safe to call
 * repeatedly for the same event; mintTickets resumes from on-chain state.
 */
export function runMintJob(eventId: string): void {
    const workerId = `${process.pid}-${Date.now()}`;

    (async () => {
        const { data: claimed, error: claimError } = await supabase.rpc("claim_event_mint", {
            p_event_id: eventId,
            p_worker_id: workerId,
        });

        if (claimError) {
            console.error(`Failed to claim mint job for event ${eventId}:`, claimError);
            return;
        }
        if (!claimed) return;

        try {
            await mintTickets({ eventId });
            await supabase
                .from("events")
                .update({
                    mint_status: "completed",
                    mint_completed_at: new Date().toISOString(),
                    mint_lock_owner: null,
                    mint_lock_acquired_at: null,
                })
                .eq("id", eventId);

            const { data: ev } = await supabase
                .from("events")
                .select("creator_id, title")
                .eq("id", eventId)
                .single();
            if (ev) {
                await notifyUser(ev.creator_id, {
                    type: "event_mint_complete",
                    body: `Tickets for "${ev.title}" have finished minting`,
                    reference_id: eventId,
                    reference_type: "event",
                    metadata: { eventId },
                });
            }
        } catch (err) {
            await supabase
                .from("events")
                .update({
                    mint_status: "failed",
                    mint_last_error: err instanceof Error ? err.message : String(err),
                    mint_lock_owner: null,
                    mint_lock_acquired_at: null,
                })
                .eq("id", eventId);

            const { data: failedEv } = await supabase
                .from("events")
                .select("creator_id, title")
                .eq("id", eventId)
                .single();
            if (failedEv) {
                await notifyUser(failedEv.creator_id, {
                    type: "event_mint_failed",
                    body: `Minting tickets for "${failedEv.title}" failed`,
                    reference_id: eventId,
                    reference_type: "event",
                    metadata: { eventId },
                }).catch(console.error);
            }
        }
    })().catch((err) => {
        console.error(`Unhandled error in mint job for event ${eventId}:`, err);
    });
}

/**
 * Re-queues any event mint job that's pending, failed, or stuck in_progress
 * with a stale lock (owner crashed without releasing it). Safe to call
 * anytime — runMintJob's atomic claim can't race an organic in-flight run.
 */
export async function resumeStuckMints() {
    const staleCutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data: stuck, error } = await supabase
        .from("events")
        .select("id")
        .lt("mint_attempts", 5)
        .or(`mint_status.eq.pending,mint_status.eq.failed,and(mint_status.eq.in_progress,mint_lock_acquired_at.lt.${staleCutoff})`);

    if (error) {
        console.error("Failed to query stuck mints:", error);
        return;
    }

    for (const event of stuck ?? []) {
        runMintJob(event.id);
    }
}

 export async function createNewTree() {

  const program = getProgram();
  const treekeyPair = Keypair.generate();

  const tx = await program.methods
      .createTree(14, 64)
      .accounts({
        payer: treasuryWeb3Keypair.publicKey,
        authority: treasuryWeb3Keypair.publicKey,
        merkleTree: treekeyPair.publicKey,
        logWrapper: SPL_NOOP_ID,
      })
      .signers([treasuryWeb3Keypair, treekeyPair])
      .rpc();

    return tx;
 }

 export async function getTicketProof(merkleTree: string, leafIndex: number) {

      const response = await fetch(`https://api.heliusxyz/v0/assets/${merkleTree}/proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "get-asset-proof",
          method: "getAssetByOwner",
          params: {
            ownerAddress: merkleTree,
            page: 1,
          },
        }),
      });

      const data = await response.json();
      return data.result;
 }

 export async function getProofByleaf(assetId: string) {

      const response = await fetch(process.env.HELIUS_RPC_URL!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: "get-proof",
                method: "getAssetProof",
                params: { id: assetId },
            }),
        });

        const data = await response.json();
        // Returns: root, proof[], leaf, treeId, nodeIndex
        return data.result;
 } 

/**
 * Marks all events whose event_date has passed as 'expired'.
 * Designed to be called by a pg_cron job or a daily cron endpoint.
 * Safe to call multiple times — only updates rows that are still 'active'.
 */
export async function expireStaleEvents() {
    const { data, error } = await supabase
        .from("events")
        .update({ status: "expired" })
        .eq("status", "active")
        .lt("event_date", new Date().toISOString())
        .select("id");

    if (error) throw error;
    return { expired: data?.length ?? 0 };
}

function getUmi() {
    const umi = createUmi(process.env.SOLANA_RPC_URL!).use(mplBubblegum());
    const umiKeypair = umi.eddsa.createKeypairFromSecretKey(treasuryWeb3Keypair.secretKey);
    return umi.use(keypairIdentity(umiKeypair));
}

export async function burnExpiredTickets() {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Only burn tickets for events that ended > 48 hours ago
    const { data: eligibleEvents } = await supabase
        .from("events")
        .select("id")
        .eq("status", "expired")
        .lt("event_date", cutoff);

    if (!eligibleEvents?.length) return { burned: 0 };

    const { data: expiredTickets } = await supabase
        .from("collectibles")
        .select("id, asset_id")
        .in("status", ["pending", "reserved"])
        .eq("custodian", "treasury")
        .in("event_id", eligibleEvents.map(e => e.id));

    if (!expiredTickets?.length) return { burned: 0 };

    const umi = getUmi();
    let burned = 0;

    for (const ticket of expiredTickets) {
        try {
            const proofRes = await fetch(process.env.HELIUS_RPC_URL!, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0", id: "get-asset",
                    method: "getAsset",
                    params: { id: ticket.asset_id },
                }),
            });
            const { result: asset } = await proofRes.json();

            const proofNodeRes = await fetch(process.env.HELIUS_RPC_URL!, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0", id: "get-proof",
                    method: "getAssetProof",
                    params: { id: ticket.asset_id },
                }),
            });
            const { result: proof } = await proofNodeRes.json();

            await burn(umi, {
                leafOwner: umi.identity.publicKey,
                merkleTree: umiPublicKey(proof.tree_id),
                root: new Uint8Array(bs58.decode(proof.root)),
                dataHash: new Uint8Array(bs58.decode(asset.compression.data_hash)),
                creatorHash: new Uint8Array(bs58.decode(asset.compression.creator_hash)),
                nonce: asset.compression.leaf_id,
                index: asset.compression.leaf_id,
                proof: proof.proof.map((p: string) => umiPublicKey(p)),
            }).sendAndConfirm(umi);

            await supabase
                .from("collectibles")
                .update({ status: "expired" })
                .eq("id", ticket.id);

            burned++;
        } catch (err) {
            console.error(`Failed to burn ticket ${ticket.asset_id}:`, err);
        }
    }

    return { burned };
}

export async function getEventById(eventId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, venue, event_date, flyer_card")
    .eq("id", eventId)
    .single();
  if (error) throw error;
  return data;
}

export async function getEventStats(eventId: string, userId: string) {
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, creator_id, title, ticket_supply, ticket_price")
    .eq("id", eventId)
    .single();

  if (eventError || !event) throw new Error("Event not found");
  if (event.creator_id !== userId) throw new Error("Unauthorized");

  const [likesResult, mintedResult, soldRowsResult, tiersResult] = await Promise.all([
    supabase.from("event_likes").select("id", { count: "exact", head: true }).eq("event_id", eventId),
    supabase.from("collectibles").select("id", { count: "exact", head: true }).eq("event_id", eventId),
    supabase.from("collectibles").select("tier_id").eq("event_id", eventId).neq("custodian", "treasury"),
    supabase.from("ticket_tiers").select("id, price").eq("event_id", eventId),
  ]);

  const soldRows = soldRowsResult.data ?? [];
  const sold = soldRows.length;

  const priceByTier = new Map((tiersResult.data ?? []).map(t => [t.id, t.price]));
  const revenue = soldRows.reduce((sum, row) => sum + (priceByTier.get(row.tier_id) ?? 0), 0);

  return {
    title: event.title,
    ticketSupply: event.ticket_supply,
    ticketPrice: event.ticket_price,
    totalLikes: likesResult.count ?? 0,
    minted: mintedResult.count ?? 0,
    sold,
    revenue,
  };
}

export async function fetchEvents(limit: number = 50, offset: number = 0) {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, ticket_price, ticket_supply, event_date, venue, creator_id, flyer_card, status, ticket_tiers(id, name, price, supply, info, sort_order)")
    .eq("status", "active")
    .order("event_date", { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) throw error
  if (!data?.length) return data

  const tierIds = data.flatMap((e) => (e.ticket_tiers ?? []).map((t: any) => t.id));
  const remainingByTier = new Map<string, number>();

  if (tierIds.length) {
    const { data: pendingRows } = await supabase
      .from("collectibles")
      .select("tier_id")
      .eq("status", "pending")
      .eq("custodian", "treasury")
      .in("tier_id", tierIds);

    for (const row of pendingRows ?? []) {
      remainingByTier.set(row.tier_id, (remainingByTier.get(row.tier_id) ?? 0) + 1);
    }
  }

  return data.map((e) => ({
    ...e,
    ticket_tiers: (e.ticket_tiers ?? []).map((t: any) => ({
      ...t,
      remaining: remainingByTier.get(t.id) ?? 0,
    })),
  }));
}

export async function likeEvent({
  eventId,
  userId,
}: {
  eventId: string;
  userId: string;
}) {
  const { data: existing } = await supabase
    .from("event_likes")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    await supabase
      .from("event_likes")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);

    return { liked: false };
  }

  await supabase.from("event_likes").insert({
    event_id: eventId,
    user_id: userId,
  });

  const { data: event } = await supabase
    .from("events")
    .select("creator_id, title")
    .eq("id", eventId)
    .single();

  if (event && event.creator_id !== userId) {
    await notifyUser(event.creator_id, {
      type: "event_liked",
      body: `Someone liked your event "${event.title}"`,
      reference_id: eventId,
      reference_type: "event",
      metadata: { eventId },
    });
  }

  return { liked: true };
}

export async function preSave({
  eventId,
  userId,
}: {
  eventId: string;
  userId: string;
}) {
  const { data: existing } = await supabase
    .from("event_saves")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    await supabase
      .from("event_saves")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);

    return { saved: false };
  }

  await supabase.from("event_saves").insert({
    event_id: eventId,
    user_id: userId,
  });

  return { saved: true };
}

{/*
const { data } = await supabase
  .from("event_likes")
  .select("events(*)")
  .eq("user_id", userId);

const { count } = await supabase
  .from("event_likes")
  .select("*", { count: "exact", head: true })
  .eq("event_id", eventId); */}