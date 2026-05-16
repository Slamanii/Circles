import { loginOrSignup, resetPassword, savePushToken } from "../mod/auth";
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
