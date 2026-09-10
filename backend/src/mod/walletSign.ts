import { Connection, Transaction, VersionedTransaction } from "@solana/web3.js";
import { decryptPrivateKey } from "./auth";
import { keypairFromSecret } from "../services/solana";
import { supabase } from "../services/supabase";

const CONNECTION = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");

export async function signAndSendTransaction(userId: string, serializedTx: string, versioned: boolean) {
    const { data: user, error } = await supabase
        .from("users")
        .select("address, encrypted_private_key")
        .eq("id", userId)
        .single();

    if (error || !user) throw new Error("User not found");
    if (!user.encrypted_private_key) throw new Error("No custodial wallet on this account");

    const secret = decryptPrivateKey(user.encrypted_private_key);
    const format = secret.includes(" ") ? "mnemonic" : "legacy_key";
    const keypair = keypairFromSecret(secret, format);

    if (keypair.publicKey.toBase58() !== user.address) {
        throw new Error("Decrypted key does not match custodial wallet address");
    }

    const raw = Buffer.from(serializedTx, "base64");
    let signature: string;

    if (versioned) {
        const tx = VersionedTransaction.deserialize(raw);
        if (tx.message.staticAccountKeys[0]?.toBase58() !== user.address) {
            throw new Error("Fee payer must be the custodial wallet");
        }
        tx.sign([keypair]);
        signature = await CONNECTION.sendRawTransaction(tx.serialize(), { skipPreflight: false });
    } else {
        const tx = Transaction.from(raw);
        if (tx.feePayer?.toBase58() !== user.address) {
            throw new Error("Fee payer must be the custodial wallet");
        }
        tx.partialSign(keypair);
        signature = await CONNECTION.sendRawTransaction(tx.serialize(), { skipPreflight: false });
    }

    await CONNECTION.confirmTransaction(signature, "confirmed");
    return { signature };
}
