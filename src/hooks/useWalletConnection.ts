import AsyncStorage from "@react-native-async-storage/async-storage";
import bs58 from "bs58";
import { TextEncoder } from "text-encoding";
import { useMobileWallet } from "./useMobileWallet";
import { api } from "../services/apiClient";

const ACTIVE_WALLET_KEY = "active_wallet";
export const CUSTODIAL = "custodial" as const;

export type ActiveWallet = typeof CUSTODIAL | string;

export function useWalletConnection() {
    const { account, connect, disconnect } = useMobileWallet();

    return {
        walletAddress: account?.address?.toBase58() ?? null,
        connectWallet: connect,
        disconnectWallet: disconnect,
        connected: !!account,
    };
}

async function signOwnership(
    address: string,
    signMessage: (msg: Uint8Array) => Promise<Uint8Array>,
) {
    const { nonceToken } = await api.get<{ nonceToken: string }>(
        `/api/auth/nonce?wallet=${address}`,
        "Failed to fetch nonce",
    );

    const noncePayload = JSON.parse(atob(nonceToken.split(".")[1])) as { nonce: string };
    const message = `Login to Fuego\nNonce: ${noncePayload.nonce}`;

    const encodedMessage = new TextEncoder().encode(message);
    const signatureBytes = await signMessage(encodedMessage);
    const signature = bs58.encode(signatureBytes);

    return { message, signature, nonceToken };
}

/**
 * Links an external wallet to the currently signed-in user (every account
 * already has a custodial wallet from signup — this only ever attaches an
 * additional non-custodial address, it never resolves or creates a session).
 * Proves ownership via a fresh nonce + ed25519 signature over it.
 */
export async function linkWallet(
    account: { address: { toBase58: () => string } },
    signMessage: (msg: Uint8Array) => Promise<Uint8Array>,
): Promise<{ address: string; alreadyLinked: boolean }> {
    if (!account) throw new Error("Wallet not connected");

    const address = account.address.toBase58();
    const { message, signature, nonceToken } = await signOwnership(address, signMessage);

    const result = await api.post<{ address: string; alreadyLinked: boolean }>(
        "/api/wallet-link",
        { walletAddress: address, message, signature, nonceToken },
        "Failed to link wallet",
    );

    await setActiveWallet(address);
    return result;
}

export type StepUpPurpose = "wallet-sign" | "export-secret";

/** Re-verifies the account password and returns a short-lived, purpose-scoped token. */
export async function reauth(
    password: string,
    purpose: StepUpPurpose,
): Promise<{ stepUpToken: string; expiresIn: number }> {
    return api.post(
        "/api/auth/reauth",
        { password, purpose },
        "Re-authentication failed",
    );
}

/** Requires a fresh "export-secret" step-up token (see useStepUp). */
export async function exportWalletSecret(
    stepUpToken: string,
): Promise<{ secret: string; format: "mnemonic" | "legacy_key" }> {
    return api.get(
        "/api/export-secret",
        "Failed to export wallet secret",
        { "X-StepUp-Token": stepUpToken },
    );
}

export async function fetchLinkedWallets(): Promise<{ address: string; created_at: string }[]> {
    const { wallets } = await api.get<{ wallets: { address: string; created_at: string }[] }>(
        "/api/wallet-links",
        "Failed to fetch linked wallets",
    );
    return wallets;
}

/** null = never chosen yet (gate must show); otherwise "custodial" or a linked address. */
export async function getActiveWallet(): Promise<ActiveWallet | null> {
    return AsyncStorage.getItem(ACTIVE_WALLET_KEY);
}

export async function setActiveWallet(value: ActiveWallet): Promise<void> {
    await AsyncStorage.setItem(ACTIVE_WALLET_KEY, value);
}

/** Forces the gate to show again next entry (used by "Switch Wallet" in Settings). */
export async function clearActiveWallet(): Promise<void> {
    await AsyncStorage.removeItem(ACTIVE_WALLET_KEY);
}
