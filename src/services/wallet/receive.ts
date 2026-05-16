import { PublicKey } from "@solana/web3.js"
import { getAssociatedTokenAddress } from "@solana/spl-token"

export async function getReceiveAddress(
    walletAddress: string,
    mintAddress?: string
) {

    const owner = new PublicKey(walletAddress);

    if (!mintAddress) {
        return {
            type: "sol",
            address: owner.toBase58(),
        };
    }

    const mint = new PublicKey(mintAddress);

    const ata = await getAssociatedTokenAddress(
        mint,
        owner
    );

    return {
        type: "token",
        address: ata.toBase58(),
    }
}