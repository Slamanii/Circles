import {
    Connection,
    PublicKey,
    SystemProgram,
    Transaction,
    VersionedTransaction,
} from "@solana/web3.js";
import { createTransferInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";

const connection = new Connection(
    process.env.EXPO_PUBLIC_HELIUS_RPC_URL ?? "https://api.mainnet-beta.solana.com",
    "confirmed",
);

type SignFn = (tx: Transaction | VersionedTransaction) => Promise<any>;

async function buildAndSend(
    fromAddress: string,
    transaction: Transaction,
    signAndSend: SignFn,
): Promise<string> {
    const fromPubkey = new PublicKey(fromAddress);
    transaction.feePayer = fromPubkey;
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    const result = await signAndSend(transaction);
    // MWA returns { signature } or the raw signature string
    return result?.signature ?? result ?? "";
}

export async function sendSol({
    fromAddress,
    signAndSend,
    destination,
    amount,
}: {
    fromAddress: string;
    signAndSend: SignFn;
    destination: string;
    amount: number;
}): Promise<string> {
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey:  new PublicKey(fromAddress),
            toPubkey:    new PublicKey(destination),
            lamports:    Math.ceil(amount * 1_000_000_000),
        }),
    );
    return buildAndSend(fromAddress, transaction, signAndSend);
}

export async function sendSplToken({
    fromAddress,
    signAndSend,
    destination,
    mint,
    amount,
    decimals,
}: {
    fromAddress: string;
    signAndSend: SignFn;
    destination: string;
    mint: string;
    amount: number;
    decimals: number;
}): Promise<string> {
    const fromPubkey = new PublicKey(fromAddress);
    const mintPubkey = new PublicKey(mint);
    const destPubkey = new PublicKey(destination);

    const fromAta = getAssociatedTokenAddressSync(mintPubkey, fromPubkey);
    const toAta   = getAssociatedTokenAddressSync(mintPubkey, destPubkey);
    const rawAmount = Math.floor(amount * Math.pow(10, decimals));

    const transaction = new Transaction().add(
        createTransferInstruction(fromAta, toAta, fromPubkey, rawAmount),
    );
    return buildAndSend(fromAddress, transaction, signAndSend);
}
