import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
} from "@solana/web3.js"

const connection = new Connection(
    "https://api.mainnet-beta.solana.com",
    "confirmed",
);

export async function sendSol({
    wallet,
    destination,
    amount,
}: {
    wallet: any;
    destination: string;
    amount: number;
}) {

    const fromPubkey = wallet.account.publicKey;
    const toPubkey = new PublicKey(destination);

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey,
            toPubkey,
            lamports: amount * 1_000_000_000,
        })
    );

    transaction.feePayer = fromPubkey;

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    const signedtx = await wallet.signTransaction(transaction);

    const signature = await connection.sendRawTransaction(
        signedtx.serialize()
    );

    await connection.confirmTransaction(signature);

    return signature;
}
