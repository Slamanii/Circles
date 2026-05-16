import { createTransferInstruction, getAssociatedTokenAddress, } from "@solana/spl-token";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { supabase } from "../../backend/src/services/supabase";
import { TicketMint } from "../../shared/Types"


const connection = new Connection(
    "https://api.mainnet-beta.solana.com",
    "confirmed"
);

export async function sendSplToken({
    wallet,
    mintAddress,
    destination,
    amount,
}: {
    wallet: any;
    mintAddress: string;
    destination: string;
    amount: number;
}) {

    const mint = new PublicKey(mintAddress);

    const fromTokenAccount = await getAssociatedTokenAddress(
        mint,
        wallet.account.publicKey
    );

    const toTokenAccount = await getAssociatedTokenAddress(
        mint,
        new PublicKey(destination)
    );

    const transaction = new Transaction().add(
        createTransferInstruction(
            fromTokenAccount,
            toTokenAccount,
            wallet.account.publicKey,
            amount,
        )
    );

    const { blockhash } = await connection.getLatestBlockhash();

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.account.PublicKey;

    const signed = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(
        signed.serialize()
    );

    await connection.confirmTransaction(signature);

    return signature;
}

export async function sendTicket({
    wallet,
    mintAddress,
    recipientUsername,
}: {
    wallet: any,
    mintAddress: string,
    recipientUsername: string;
}) {

    const ownsTicket = await verifyTicketOwnership(
        wallet.publicKey.toBase58(),
        mintAddress
    );

    if (!ownsTicket) {
        throw new Error("You do not own this ticket");
    }

    const { data: user } = await supabase
        .from("users")
        .select("wallet_address")
        .eq("username", recipientUsername)
        .single();

        if (!user) {
            
            throw new Error("Unfamiliar with Wallet Address");
        } 

    const destination = user.wallet_address;

    const signature = await sendSplToken({
        wallet,
        mintAddress,
        destination: user.wallet_address,
        amount: 1,
    });

    return {
        signature,
        destination,
    }
}

export async function verifyTicketOwnership(
    walletAddress: string,
    mintAddress: string
) {

    const connection = new Connection("https://api.mainnet-beta.solana.com");

    const owner = new PublicKey(walletAddress);
    const mint = new PublicKey(mintAddress);

    const ata = await getAssociatedTokenAddress(mint, owner);

    const accountInfo = await connection.getTokenAccountBalance(ata);

    return (accountInfo.value.uiAmount ?? 0) > 0;
}


export async function fetchUserCollectibles(walletAddress: string): Promise<TicketMint[]> {
  // Option 1: On-chain query (SPL Tokens owned)
  // Option 2: Off-chain via Supabase table
  const { data, error } = await supabase
    .from("collectibles")
    .select("*")
    .eq("owner_wallet", walletAddress);

  if (error) throw error;
  return data as TicketMint[];
}


export async function fetchSplTokens(walletAddress: string) {

    const publicKey = new PublicKey(walletAddress);

    const tokens = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
    );

    return tokens.value.map((t) => ({
        mint: t.account.data.parsed.info.mint,
        balance: t.account.data.parsed.info.tokenAmount.uiAmount
    }));
}

{/*const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function sendTicket(ticketId: string) {
  const res = await fetch(`${API_URL}/tickets/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ticketId }),
  });

  if (!res.ok) throw new Error("Failed to send ticket");

  return res.json();
}

export async function listTicket(ticketId: string) {
  const res = await fetch(`${API_URL}/tickets/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ticketId }),
  });

  if (!res.ok) throw new Error("Failed to list ticket");

  return res.json();
}
*/}

