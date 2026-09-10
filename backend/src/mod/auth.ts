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

// ── Step-up (re-auth) ─────────────────────────────────────────────────────────
// expo-local-authentication (this app's biometric lock) never leaves the device —
// there's no signal the server can verify from it. Password re-entry is the
// actual server-verifiable proof; the client may still show Face ID first as a
// convenience before prompting for the password.

export const STEP_UP_PURPOSES = ["wallet-sign", "export-secret"] as const;
export type StepUpPurpose = typeof STEP_UP_PURPOSES[number];

export async function reauth(userId: string, password: string, purpose: StepUpPurpose) {
    const { data: user } = await supabase
        .from("users")
        .select("password_hash")
        .eq("id", userId)
        .single();

    if (!user?.password_hash) throw new Error("Password re-authentication not available for this account");

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error("Invalid password");

    const stepUpToken = jwt.sign({ userId, purpose }, process.env.JWT_SECRET!, { expiresIn: "5m" });
    return { stepUpToken, expiresIn: 300 };
}

export function requireStepUp(purpose: StepUpPurpose) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const token = req.headers["x-stepup-token"];
        if (typeof token !== "string") {
            return res.status(401).json({ error: "Step-up verification required" });
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; purpose: string };
            if (decoded.userId !== req.user!.id || decoded.purpose !== purpose) {
                return res.status(401).json({ error: "Invalid step-up token" });
            }
            next();
        } catch {
            return res.status(401).json({ error: "Step-up token expired or invalid" });
        }
    };
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
        // encrypted_private_key repurposed: now stores the AES-encrypted BIP39 mnemonic
        const encrypted_private_key = encryptPrivateKey(wallet.mnemonic);

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

        const token = signToken(user.id, user.email);
        // Return mnemonic only on first creation so the client can show it once
        return { user, token, mnemonic: wallet.mnemonic };
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

// ── Wallet linking ───────────────────────────────────────────────────────────
// Every real path here already carries an authenticated app session (every
// account gets a custodial wallet at signup) — this proves ownership of an
// external wallet and attaches it to the CURRENT user, it never resolves or
// creates an identity from a bare address.

function verifyWalletOwnership(walletAddress: string, signature: string, message: string, nonceToken: string) {
    if (!walletAddress || !signature || !message || !nonceToken) {
        throw new Error("Missing fields");
    }

    let decoded: { wallet: string; nonce: string };
    try {
        decoded = jwt.verify(nonceToken, process.env.JWT_SECRET!) as { wallet: string; nonce: string };
    } catch {
        throw new Error("Invalid or expired nonce");
    }
    if (decoded.wallet !== walletAddress) {
        throw new Error("Nonce wallet mismatch");
    }

    const expectedMessage = `Login to Fuego\nNonce: ${decoded.nonce}`;
    if (message !== expectedMessage) {
        throw new Error("Message mismatch");
    }

    const publicKey = new PublicKey(walletAddress);
    const verified = nacl.sign.detached.verify(
        new TextEncoder().encode(message),
        bs58.decode(signature),
        publicKey.toBytes(),
    );
    if (!verified) throw new Error("Invalid signature");
}

export async function linkWallet(
    userId: string,
    walletAddress: string,
    signature: string,
    message: string,
    nonceToken: string,
) {
    verifyWalletOwnership(walletAddress, signature, message, nonceToken);

    const { data: existing } = await supabase
        .from("wallets")
        .select("user_id")
        .eq("address", walletAddress)
        .maybeSingle();

    if (existing) {
        if (existing.user_id !== userId) {
            throw new Error("Wallet already linked to a different account");
        }
        return { address: walletAddress, alreadyLinked: true };
    }

    const { data, error } = await supabase
        .from("wallets")
        .insert({ user_id: userId, address: walletAddress })
        .select()
        .single();

    if (error) throw error;
    return { address: data.address, alreadyLinked: false };
}

export async function listLinkedWallets(userId: string) {
    const { data, error } = await supabase
        .from("wallets")
        .select("address, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
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
// AES-256-GCM (authenticated — catches tampering/bit-flipping that plain CBC
// can't) with a versioned key id baked into the ciphertext, so the master key
// can be rotated later by introducing WALLET_ENCRYPTION_KEY_V2 etc. without
// invalidating already-encrypted rows. `decryptPrivateKey` still understands
// the original unversioned aes-256-cbc format (`iv:ciphertext`, no auth tag)
// so pre-existing rows keep decrypting as-is — there is no data migration.

const CURRENT_KEY_VERSION = process.env.WALLET_ENCRYPTION_KEY_VERSION || "v1";

function resolveEncryptionKey(version: string): Buffer {
    const envVar = version === "v1" ? "WALLET_ENCRYPTION_KEY" : `WALLET_ENCRYPTION_KEY_${version.toUpperCase()}`;
    const hex = process.env[envVar];
    if (!hex) throw new Error(`Missing encryption key for version "${version}" (expected env var ${envVar})`);
    return Buffer.from(hex, "hex");
}

export function encryptPrivateKey(secretKey: string) {
    const version = CURRENT_KEY_VERSION;
    const key = resolveEncryptionKey(version);
    const iv = crypto.randomBytes(12); // GCM's recommended IV size
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(secretKey, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${version}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptPrivateKey(encryptedKey: string) {
    const parts = encryptedKey.split(":");

    // Legacy unversioned aes-256-cbc format: `iv:ciphertext` (no auth tag).
    if (parts.length === 2) {
        const [ivHex, encrypted] = parts;
        const decipher = crypto.createDecipheriv(
            "aes-256-cbc",
            resolveEncryptionKey("v1"),
            Buffer.from(ivHex, "hex"),
        );
        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    }

    const [version, ivHex, authTagHex, encryptedHex] = parts;
    const decipher = crypto.createDecipheriv("aes-256-gcm", resolveEncryptionKey(version), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]);
    return decrypted.toString("utf8");
}

export async function exportWalletSecret(userId: string): Promise<{ secret: string; format: "mnemonic" | "legacy_key" }> {
    const { data: user, error } = await supabase
        .from("users")
        .select("encrypted_private_key")
        .eq("id", userId)
        .single();

    if (error || !user) throw new Error("User not found");
    if (!user.encrypted_private_key) throw new Error("No custodial wallet on this account");

    const secret = decryptPrivateKey(user.encrypted_private_key);
    // BIP39 mnemonics contain spaces; base64 secret keys do not
    const format = secret.includes(" ") ? "mnemonic" : "legacy_key";
    return { secret, format };
}

export async function deleteAccount(userId: string) {
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + 30);

    const { error } = await supabase
        .from("users")
        .update({
            pending_deletion: true,
            deletion_scheduled_at: scheduledFor.toISOString(),
        })
        .eq("id", userId);

    if (error) throw error;
    return { scheduled_for: scheduledFor.toISOString() };
}
