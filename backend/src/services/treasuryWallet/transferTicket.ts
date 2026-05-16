import { mplBubblegum, transferV2 } from "@metaplex-foundation/mpl-bubblegum"
import { publicKey } from "@metaplex-foundation/umi"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { Connection } from "@solana/web3.js"
import fs from "fs"

//rewrite this 
const umi = createUmi("https://api.mainnet-beta.solana.com")
                .use(mplBubblegum())


const connection = new Connection("https://api.mainnet-beta.solana.com");
const secret = JSON.parse(
    fs.readFileSync("./treasury-keypair.json", "utf8")
)
export const treasuryKeypair = umi.eddsa.createKeypairFromSecretKey(
   new  Uint8Array(secret)
)


/**
 * Executes a cNFT transfer signed by the treasury keypair.
 * Only valid when treasury is the current leaf owner (i.e. before first purchase).
 * For user-to-user transfers, the user must sign on the frontend via mobile wallet.
 */
export async function transferCompressedNFT({
    treeAddress,
    leafIndex,
    newOwner,
    proof,
}: {
    treeAddress: string;
    leafIndex: number;
    newOwner: string; // recipient Solana address
    proof: any;
}) {
    const builder = transferV2(umi, {
        leafOwner: treasuryKeypair.publicKey,
        newLeafOwner: publicKey(newOwner),
        merkleTree: publicKey(treeAddress),
        root: proof.root,
        dataHash: proof.data_hash,
        creatorHash: proof.creator_hash,
        nonce: leafIndex,
        index: leafIndex,
        proof: proof.proof.map((node: string) => publicKey(node)),
    });

    const result = await builder.sendAndConfirm(umi);
    return result.signature;
}



