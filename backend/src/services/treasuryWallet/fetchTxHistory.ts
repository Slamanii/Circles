import { PublicKey } from "@solana/web3.js"
import { supabase } from "../supabase"
import { treasuryWeb3Keypair } from "../../mod/events"

export const TREASURY_WALLET = treasuryWeb3Keypair.publicKey.toBase58()

export async function fetchTreasuryTxHistory(limit: number = 50, offset: number = 0) {

  const { data, error } = await supabase
    .from("tx_history")
    .select(`
      id,
      tx_signature,
      action,
      asset_id,
      from_wallet,
      to_wallet,
      status,
      created_at
    `)
    .eq("wallet_role", "treasury")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw error
  }

  return data
}

export async function fetchTreasuryTxHistoryOnchain(
  limit: number = 20
) {

  const url = `https://api.helius.xyz/v0/addresses/${TREASURY_WALLET}/transactions?api-key=${process.env.HELIUS_API_KEY}&limit=${limit}`

  const res = await fetch(url)

  if (!res.ok) {
    throw new Error("Failed to fetch on-chain treasury tx history")
  }

  const data = await res.json()

  return data
}

export function parseTreasuryTxLogs(txs: any[]) {

  return txs.map(tx => ({
    signature: tx.signature,
    timestamp: tx.timestamp,
    type: tx.type,
    description: tx.description,
    source: tx.source,
    destination: tx.destination
  }))
}

// ── Any wallet's on-chain history (Helius enhanced API), used by the
// authenticated user's own wallet — kept server-side so HELIUS_API_KEY
// never reaches the client. ──────────────────────────────────────────────

export async function fetchWalletTxHistoryOnchain(
  address: string,
  limit: number = 20
) {
  // Validates the address is a real Solana pubkey before it's interpolated
  // into the Helius URL, rejecting malformed input early.
  new PublicKey(address)

  const url = `https://api.helius.xyz/v0/addresses/${encodeURIComponent(address)}/transactions?api-key=${process.env.HELIUS_API_KEY}&limit=${limit}`

  const res = await fetch(url)

  if (!res.ok) {
    throw new Error("Failed to fetch on-chain wallet tx history")
  }

  return res.json()
}

export function parseWalletTxLogs(txs: any[]) {

  return txs.map(tx => ({
    signature: tx.signature,
    type: tx.type ?? "UNKNOWN",
    timestamp: tx.timestamp ?? 0,
    fee: tx.fee ?? 0,
    amount: tx.nativeTransfers?.[0]?.amount,
    token: tx.tokenTransfers?.[0]?.mint,
    from: tx.nativeTransfers?.[0]?.fromUserAccount,
    to: tx.nativeTransfers?.[0]?.toUserAccount,
  }))
}