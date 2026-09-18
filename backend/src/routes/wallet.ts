import {
    fetchTreasuryTxHistory,
    fetchTreasuryTxHistoryOnchain,
    fetchWalletTxHistoryOnchain,
    parseTreasuryTxLogs,
    parseWalletTxLogs
} from "../services/treasuryWallet/fetchTxHistory"
import { signAndSendTransaction } from "../mod/walletSign"
import { AuthRequest } from "../mod/auth"
import { Response } from "express"

export async function fetchTreasuryTxHistoryRouter(req: AuthRequest, res: Response) {

  try {

    const limit = Number(req.query.limit) || 50
    const offset = Number(req.query.offset) || 0

    const result = await fetchTreasuryTxHistory(limit, offset)

    res.status(200).json(result)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Failed to fetch treasury transaction history"
    })
  }
}

export async function fetchTxHistoryOnchainRouter(req: AuthRequest, res: Response) {

  try {

    const limit = Number(req.query.limit) || 20

    const txs = await fetchTreasuryTxHistoryOnchain(limit)

    const txsComplete = parseTreasuryTxLogs(txs)

    res.status(200).json(txsComplete)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Failed to fetch onchain treasury transactions"
    })
  }
}

export async function fetchWalletTxHistoryOnchainRouter(req: AuthRequest, res: Response) {

  try {

    const address = req.query.address as string | undefined
    if (!address) return res.status(400).json({ error: "address required" })

    const limit = Number(req.query.limit) || 20

    const txs = await fetchWalletTxHistoryOnchain(address, limit)

    const txsComplete = parseWalletTxLogs(txs)

    res.status(200).json(txsComplete)

  } catch (error) {

    console.error(error)

    const message = error instanceof Error ? error.message : "Failed to fetch onchain wallet transactions"

    res.status(400).json({ error: message })
  }
}

export async function signAndSendRouter(req: AuthRequest, res: Response) {
  try {

    const { transaction, versioned } = req.body as { transaction?: string; versioned?: boolean }

    if (!transaction) return res.status(400).json({ error: "transaction required" })

    const result = await signAndSendTransaction(req.user!.id, transaction, !!versioned)

    res.status(200).json(result)

  } catch (error) {

    console.error(error)

    const message = error instanceof Error ? error.message : "Failed to sign and send transaction"

    res.status(400).json({ error: message })
  }
}