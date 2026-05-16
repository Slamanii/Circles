import { Keypair } from "@solana/web3.js"

export function generateSolanaWallet() {

    const keypair = Keypair.generate();

    return {
        publicKey: keypair.publicKey.toBase58(),
        secretKey: Buffer.from(keypair.secretKey).toString("base64"),
    };
}