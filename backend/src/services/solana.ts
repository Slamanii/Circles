import { Keypair } from "@solana/web3.js";
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";

const SOLANA_BIP44 = "m/44'/501'/0'/0'";

export function generateSolanaWallet(): { publicKey: string; mnemonic: string } {
    const mnemonic = bip39.generateMnemonic(256); // 24 words
    const seed     = bip39.mnemonicToSeedSync(mnemonic);
    const { key }  = derivePath(SOLANA_BIP44, seed.toString("hex"));
    const keypair  = Keypair.fromSeed(key);

    return {
        publicKey: keypair.publicKey.toBase58(),
        mnemonic,
    };
}
