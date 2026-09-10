import { loginOrSignup, resetPassword, savePushToken, getNonce, deleteAccount, exportWalletSecret, linkWallet, listLinkedWallets, reauth, StepUpPurpose, STEP_UP_PURPOSES } from "../mod/auth";
import { AuthRequest } from "../mod/auth";
import { Response, Request } from "express";

export async function loginOrSignupRouter(req: Request, res: Response) {
    try {
        const { email, password } = req.body as { email: string; password: string };

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        const result = await loginOrSignup(email, password);
        res.status(200).json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to login";
        res.status(401).json({ error: message });
    }
}

export async function resetPasswordRouter(req: Request, res: Response) {
    try {
        const { email, newPassword, resetToken } = req.body;
        if (!email || !newPassword || !resetToken) {
            return res.status(400).json({ error: "email, newPassword, and resetToken required" });
        }
        await resetPassword(email, newPassword, resetToken);
        res.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Reset failed";
        res.status(400).json({ error: message });
    }
}

export async function savePushTokenRouter(req: AuthRequest, res: Response) {
    return savePushToken(req, res);
}

export function getNonceRouter(req: Request, res: Response) {
    return getNonce(req, res);
}

export async function deleteAccountRouter(req: AuthRequest, res: Response) {
    try {
        const result = await deleteAccount(req.user!.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete account" });
    }
}

export async function exportWalletSecretRouter(req: AuthRequest, res: Response) {
    try {
        const result = await exportWalletSecret(req.user!.id);
        res.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to export wallet secret";
        const status = message.includes("No custodial") ? 404 : 500;
        res.status(status).json({ error: message });
    }
}

export async function linkWalletRouter(req: AuthRequest, res: Response) {
    try {
        const { walletAddress, signature, message, nonceToken } = req.body;
        const result = await linkWallet(req.user!.id, walletAddress, signature, message, nonceToken);
        res.json(result);
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed to link wallet";
        const status = msg === "Wallet already linked to a different account" ? 409
            : msg === "Missing fields" ? 400
            : 401;
        res.status(status).json({ error: msg });
    }
}

export async function listLinkedWalletsRouter(req: AuthRequest, res: Response) {
    try {
        const wallets = await listLinkedWallets(req.user!.id);
        res.json({ wallets });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch linked wallets" });
    }
}

export async function reauthRouter(req: AuthRequest, res: Response) {
    try {
        const { password, purpose } = req.body as { password?: string; purpose?: StepUpPurpose };
        if (!password || !purpose) {
            return res.status(400).json({ error: "password and purpose required" });
        }
        if (!STEP_UP_PURPOSES.includes(purpose)) {
            return res.status(400).json({ error: "Invalid purpose" });
        }
        const result = await reauth(req.user!.id, password, purpose);
        res.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Re-authentication failed";
        res.status(401).json({ error: message });
    }
}
