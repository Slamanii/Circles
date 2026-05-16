import {
    fetchTreasuryTxHistory,
    fetchTreasuryTxHistoryOnchain,
    parseTreasuryTxLogs
} from "../services/treasuryWallet/fetchTxHistory"
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