import { PublicKey } from "@solana/web3.js";
import bcrypt from "bcrypt";
import bs58 from "bs58";
import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import nacl from "tweetnacl";
import { generateSolanaWallet } from "../services/solana";
import { supabase } from "../services/supabase";

const SALT_ROUNDS = 12;

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

export function requireCronSecret(req: Request, res: Response, next: NextFunction) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return res.status(500).json({ error: "CRON_SECRET not configured" });
    if (req.headers.authorization !== `Bearer ${secret}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}

export async function requireUser(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Missing token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            userId: string;
            email: string;
        };
        req.user = { id: decoded.userId, email: decoded.email };
        next();
    } catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}

function signToken(userId: string, email: string) {
    return jwt.sign({ userId, email }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

// ── Email + password auth ────────────────────────────────────────────────────

export async function loginOrSignup(email: string, password: string) {
    let { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

    if (!user) {
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
        const wallet = generateSolanaWallet();
        const encrypted_private_key = encryptPrivateKey(wallet.secretKey);

        const { data, error } = await supabase
            .from("users")
            .insert({
                email,
                password_hash,
                username: email.split("@")[0],
                display_name: email.split("@")[0],
                address: wallet.publicKey,
                encrypted_private_key,
            })
            .select()
            .single();

        if (error) throw error;
        user = data;
    } else {
        if (!user.password_hash) {
            throw new Error("This account uses wallet login");
        }
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) throw new Error("Invalid password");
    }

    const token = signToken(user.id, user.email);
    return { user, token };
}

export async function resetPassword(email: string, newPassword: string, resetToken: string) {
    const { data: record } = await supabase
        .from("password_resets")
        .select("*")
        .eq("email", email)
        .eq("token", resetToken)
        .gt("expires_at", new Date().toISOString())
        .single();

    if (!record) throw new Error("Invalid or expired reset token");

    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await supabase.from("users").update({ password_hash }).eq("email", email);
    await supabase.from("password_resets").delete().eq("email", email);
}

// ── Nonce ────────────────────────────────────────────────────────────────────

export function getNonce(req: Request, res: Response) {
    const { wallet } = req.query as { wallet?: string };
    if (!wallet) return res.status(400).json({ error: "wallet address required" });

    const nonceToken = jwt.sign(
        { wallet, nonce: crypto.randomBytes(16).toString("hex") },
        process.env.JWT_SECRET!,
        { expiresIn: "2m" },
    );

    res.json({ nonceToken });
}

// ── Wallet auth ──────────────────────────────────────────────────────────────

export async function walletLogin(req: Request, res: Response) {
    const { walletAddress, signature, message, nonceToken } = req.body;

    if (!walletAddress || !signature || !message || !nonceToken) {
        return res.status(400).json({ error: "Missing fields" });
    }

    // Verify nonce JWT — checks expiry and that it was issued for this address
    let nonce: string;
    try {
        const decoded = jwt.verify(nonceToken, process.env.JWT_SECRET!) as {
            wallet: string;
            nonce: string;
        };
        if (decoded.wallet !== walletAddress) {
            return res.status(401).json({ error: "Nonce wallet mismatch" });
        }
        nonce = decoded.nonce;
    } catch {
        return res.status(401).json({ error: "Invalid or expired nonce" });
    }

    // Confirm the signed message contains the nonce
    const expectedMessage = `Login to Fuego\nNonce: ${nonce}`;
    if (message !== expectedMessage) {
        return res.status(401).json({ error: "Message mismatch" });
    }

    try {
        const publicKey = new PublicKey(walletAddress);
        const verified = nacl.sign.detached.verify(
            new TextEncoder().encode(message),
            bs58.decode(signature),
            publicKey.toBytes(),
        );

        if (!verified) return res.status(401).json({ error: "Invalid signature" });

        let { data: user } = await supabase
            .from("users")
            .select("*")
            .eq("address", walletAddress)
            .single();

        if (!user) {
            const { data } = await supabase
                .from("users")
                .insert({
                    address: walletAddress,
                    username: `user_${walletAddress.slice(0, 6)}`,
                    display_name: `user_${walletAddress.slice(0, 6)}`,
                })
                .select()
                .single();
            user = data;
        }

        const token = signToken(user.id, user.email ?? "");
        res.json({ user, token });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
}

// ── Push token ───────────────────────────────────────────────────────────────

export async function savePushToken(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const { token } = req.body;

    if (!token) return res.status(400).json({ error: "Missing token" });

    await supabase
        .from("push_tokens")
        .upsert({ user_id: userId, token }, { onConflict: "user_id" });

    res.json({ success: true });
}

// ── Key encryption (for custodial wallet private keys) ───────────────────────

export function encryptPrivateKey(secretKey: string) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        Buffer.from(process.env.WALLET_ENCRYPTION_KEY!, "hex"),
        iv,
    );
    let encrypted = cipher.update(secretKey, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
}

export function decryptPrivateKey(encryptedKey: string) {
    const [ivHex, encrypted] = encryptedKey.split(":");
    const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(process.env.WALLET_ENCRYPTION_KEY!, "hex"),
        Buffer.from(ivHex, "hex"),
    );
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
