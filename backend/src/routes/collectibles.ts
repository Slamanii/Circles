import { initiatePaystackPay, paystackWebhook } from "../services/paystack";
import { getPaymentOptions, confirmWalletPurchase } from "../services/walletPay";
import { fetchUserCollectibles, getCollectibleProof, transferTicketP2P } from "../mod/collectibles";
import { AuthRequest } from "../mod/auth"
import { Response } from "express"


export async function getPaymentOptionsRouter(req: AuthRequest, res: Response) {
    try {
        const { eventId, quantity } = req.body;
        const result = await getPaymentOptions(eventId, Number(quantity));
        res.json(result);
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: msg });
    }
}

export async function confirmWalletPurchaseRouter(req: AuthRequest, res: Response) {
    try {
        const userId = req.user!.id;
        const { eventId, txSignature, tokenMint, quantity } = req.body;
        const result = await confirmWalletPurchase({ userId, eventId, txSignature, tokenMint, quantity: Number(quantity) });
        res.json(result);
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: msg });
    }
}

export async function initiatePaystackPayRouter(req: AuthRequest, res: Response) {
    try {
        const userId = req.user!.id;
        const { eventId, quantity } = req.body;
        const result = await initiatePaystackPay({ userId, eventId, quantity });
        res.json(result);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: errorMessage });
    }
}

export async function initiatepaystackWebhookRouter(req: AuthRequest, res: Response) {

   try {

      await paystackWebhook(req)

      res.sendStatus(200)

   } catch (err) {

      console.error(err)

      res.sendStatus(500)

   }

}

export async function paystackReturn(req: AuthRequest, res: Response) {
    const { reference } = req.query;
    if (!reference) return res.status(400).send("Missing reference");
    res.redirect(`fuego://payment?reference=${reference}&status=success`);
}

export async function fetchCollectiblesRouter(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    try {
        const data = await fetchUserCollectibles(userId);
        res.json({ collectibles: data });
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: errorMessage });
    }
}

export async function getTicketProofRouter(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const { assetId } = req.query as { assetId: string };

    if (!assetId) return res.status(400).json({ error: "assetId required" });

    try {
        const result = await getCollectibleProof(assetId, userId);
        res.json(result);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: errorMessage });
    }
}

export async function transferTicketRouter(req: AuthRequest, res: Response) {
    const senderUserId = req.user!.id;
    const { assetId, recipientUserId } = req.body;

    if (!assetId || !recipientUserId) {
        return res.status(400).json({ error: "assetId and recipientUserId required" });
    }

    try {
        const result = await transferTicketP2P({ assetId, senderUserId, recipientUserId });
        res.json(result);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: errorMessage });
    }
}



/*router.post("/send", async (req, res) => {
  const { ticketId } = req.body;

  try {
    // TODO:
    // verify ownership
    // transfer ticket
    // update DB

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send ticket" });
  }
});

router.post("/list", async (req, res) => {
  const { ticketId } = req.body;

  try {
    // TODO:
    // mark ticket listed
    // create marketplace entry

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to list ticket" });
  }
});*/