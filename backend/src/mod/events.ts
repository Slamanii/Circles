import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey
} from "@solana/web3.js";
import BN from "bn.js";
import fs from "fs";
import IDL from "../../../target/idl/ticket_program.json";
import { TicketProgram } from "../../../target/types/ticket_program";
import { supabase } from "../services/supabase";
import { createGroupChat } from "./chat";

const CONNECTION = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");
const PROGRAM_ID = new PublicKey(process.env.PROGRAM_ID!); 


const BUBBLEGUM_PROGRAM_ID = new PublicKey("");
const SPL_COMPRESSION_ID = new PublicKey("");
const SPL_NOOP_ID = new PublicKey("");

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
    })
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
        creatorId: userId,
    });

    return {
        event: { ...event, group_id: group.id },
        group,
        onChainTx,
        mint: mintResult,
    };
 }

 export async function mintTickets({
    supply,
    eventId,
    creatorId,
 }: {
    supply: number;
    eventId: string;
    creatorId: string;
 }) {
    
    const program = getProgram();
    
    const [globalStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("global_state")],
        PROGRAM_ID
    );

    
    const globalState = await program.account.globalState.fetch(globalStatePda);
    const merkleTree = new PublicKey(globalState.currentTree);

    const [eventPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("event"), Buffer.from(eventId)],
      PROGRAM_ID
    );

    const eventAccount = await program.account.event.fetch(eventPda);
    const remaining = eventAccount.maxSupply.toNumber() - eventAccount.minted.toNumber();

    if (remaining <= 0) {
      throw new Error("Event sold out");
    }

    const maxLeaves = Math.pow(2, globalState.maxDepth);
    const mintedInTree = globalState.mintedInCurrentTree.toNumber();

    if (mintedInTree >= maxLeaves) {
      throw new Error("TREE_FULL");
    }

    const metadata = {
      name: `Ticket #${eventAccount.minted.toNumber() + 1}`,
      symbol: "TKT",
      uri: `https://your-metadata-api.com/events/${eventId}/tickets/${eventAccount.minted.toNumber() + 1}`,
    };

    try {
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

        const leafIndex = mintedInTree;

        await supabase.from("collectibles").insert({
          event_id: eventId,
          merkle_tree: merkleTree.toBase58(),
          leaf_index: leafIndex,
          owner: treasuryWeb3Keypair.publicKey.toBase58(),
          tx_signature: tx,
          metadata_uri: metadata.uri,
        });

        return {
        mintAddress: merkleTree.toBase58(),
        leafIndex,
        txSignature: tx,
        supply,
    };

  } catch (err: any) {
    if (err.message?.includes("TREE_FULL") || err.logs?.some((l: string) => l.includes("TreeFull"))) {

      await createNewTree();
      return mintTickets({ supply, eventId, creatorId });
    }
    throw err;
  }
   //incase mint fails & to avoid queing mint requests wrap the operations form DB in a transaction via sql or rpc
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