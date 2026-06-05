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

const CONNECTION = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");
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

 export async function createEvent(userId: string, data: any) {

    const {
        title,
        description,
        ticketSupply,
        ticketPrice,
        eventDate,
        venue,
        flyerCard,
        creatorName,
    } = data;

    // 1. Insert event without group_id (group doesn't exist yet)
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

    // 2. Create group chat for the event
    const group = await createGroupChat(userId, creatorName ?? title, event.id);

    // 3. Back-fill group_id on the event row
    await supabase
        .from("events")
        .update({ group_id: group.id })
        .eq("id", event.id);

    // 4. Initialize on-chain event with real metadata
    const onChainTx = await initializeEventOnchain({
        eventId: event.id,
        title,
        maxSupply: ticketSupply,
    });

    // 5. Mint all cNFT tickets into treasury
    const mintResult = await mintTickets({
        supply: ticketSupply,
        eventId: event.id,
    });

    return {
        event: { ...event, group_id: group.id },
        group,
        onChainTx,
        mint: mintResult,
    };
 }

async function mintOneCnft(eventId: string) {
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

    const metadata = {
        name: `Ticket #${serialNumber}`,
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
        status: "pending",
    });

    return { assetId: assetId.toBase58(), leafIndex, txSignature: tx };
}

export async function mintTickets({
    supply,
    eventId,
}: {
    supply: number;
    eventId: string;
}) {
    const results = [];

    for (let i = 0; i < supply; i++) {
        try {
            results.push(await mintOneCnft(eventId));
        } catch (err: any) {
            if (err.message?.includes("TREE_FULL") || err.logs?.some((l: string) => l.includes("TreeFull"))) {
                await createNewTree();
                results.push(await mintOneCnft(eventId));
            } else {
                throw err;
            }
        }
    }

    return results;
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

export async function fetchEvents(limit: number = 50, offset: number = 0) {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, ticket_price, ticket_supply, event_date, venue, creator_id, flyer_card, status")
    .eq("status", "active")
    .order("event_date", { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
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