import AsyncStorage from "@react-native-async-storage/async-storage";
import bs58 from "bs58";
import { TextEncoder } from "text-encoding";
import { useMobileWallet } from "./useMobileWallet";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export function useWalletConnection() {
    const { account, connect, disconnect } = useMobileWallet();

    return {
        walletAddress: account?.address?.toBase58() ?? null,
        connectWallet: connect,
        disconnectWallet: disconnect,
        connected: !!account,
    };
}

/**
 * Non-custodial login flow:
 * 1. Fetch a 2-min nonce JWT from the server
 * 2. Embed the nonce in the signed message so the server can verify freshness
 * 3. Phantom signs it via MWA
 * 4. Server verifies nonce + ed25519 signature, returns session token
 * 5. Store token + user keyed by wallet address so multiple addresses never collide
 */
export async function loginWithWallet(
    account: { address: { toBase58: () => string } },
    signMessage: (msg: Uint8Array) => Promise<Uint8Array>,
) {
    if (!account) throw new Error("Wallet not connected");

    const address = account.address.toBase58();

    const nonceRes = await fetch(`${API_URL}/api/auth/nonce?wallet=${address}`);
    if (!nonceRes.ok) throw new Error("Failed to fetch nonce");
    const { nonceToken } = await nonceRes.json();

    const noncePayload = JSON.parse(atob(nonceToken.split(".")[1])) as { nonce: string };
    const message = `Login to Fuego\nNonce: ${noncePayload.nonce}`;

    const encodedMessage = new TextEncoder().encode(message);
    const signatureBytes = await signMessage(encodedMessage);
    const signature = bs58.encode(signatureBytes);

    const res = await fetch(`${API_URL}/api/wallet-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, message, signature, nonceToken }),
    });
    if (!res.ok) throw new Error("Wallet login failed");
    const data = await res.json();

    await Promise.all([
        AsyncStorage.setItem(`wallet:${address}:token`, data.token),
        AsyncStorage.setItem(`wallet:${address}:user`, JSON.stringify(data.user)),
        AsyncStorage.setItem("active_wallet", address),
        AsyncStorage.setItem("token", data.token),
        AsyncStorage.setItem("user", JSON.stringify(data.user)),
    ]);

    return data;
}

/** Restore whichever wallet session was last active. */
export async function restoreWalletSession(): Promise<{ token: string; user: any } | null> {
    const address = await AsyncStorage.getItem("active_wallet");
    if (!address) return null;
    const token = await AsyncStorage.getItem(`wallet:${address}:token`);
    const userRaw = await AsyncStorage.getItem(`wallet:${address}:user`);
    if (!token || !userRaw) return null;
    return { token, user: JSON.parse(userRaw) };
}
