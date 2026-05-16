import { Connection, PublicKey } from "@solana/web3.js"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { WalletTokens } from "../../../shared/Types" 


const connection = new Connection("https://api.mainnet-beta.solana.com");


export async function fetchSolBalances(walletAddress: string) {

  const publicKey = new PublicKey(walletAddress);

  const solLamports = await connection.getBalance(publicKey);
  
   const tokens = await connection.getParsedTokenAccountsByOwner(publicKey,
        {
            programId: TOKEN_PROGRAM_ID,
        }
    );
    
  return {
    sol: solLamports / 1_000_000_000,
    tokens: tokens.value,
  }
}

export async function fetchTokenAddresses(walletAddress: string,  mintAddress: string ) {

    const publicKey = new PublicKey(walletAddress);
    const mint = new PublicKey(mintAddress);


    const ata = await getAssociatedTokenAddress(
        mint,
        publicKey,
    ); 

    return {
        ata
    }
}
 