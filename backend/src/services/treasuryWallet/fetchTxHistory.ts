import { supabase } from "../supabase"

export const TREASURY_WALLET = "treasuryWalletAddress";

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