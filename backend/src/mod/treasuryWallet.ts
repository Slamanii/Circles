import { Program } from "@project-serum/anchor";
import { getConcurrentMerkleTreeAccountSize } from "@solana/spl-account-compression";
import { PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } from "@solana/web3.js";
import { SPL_NOOP_PROGRAM_ID } from '@solana/spl-account-compression';   

export async function createTreeAccount(program: Program, treasury: Keypair) {
    const maxDepth = 14;
    const maxBufferSize = 64;

    // calculate size for tree account
    const treeSize = getConcurrentMerkleTreeAccountSize(maxDepth, maxBufferSize);

    // create new account for tree
    const treeAccount = Keypair.generate();

    const lamports = await program.provider.connection.getMinimumBalanceForRentExemption(treeSize);

    const [treeAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from("tree_authority")],
        program.programId,
    );

    const tx = new Transaction();

    // 1. Create the tree account
    tx.add(
         SystemProgram.createAccount({
            fromPubkey: treasury.publicKey,
            newAccountPubkey: treeAccount.publicKey,
            lamports,
            space: treeSize,
            programId: new PublicKey("8Ed9Jimrz4istGe3C9QViAUsvBxTUof7MiFyJsAmpVy1"),
        })
    );

    // 2. Call create_tree instruction in your program
    tx.add(
        await program.methods
            .createTree(maxDepth, maxBufferSize)
            .accounts({
                payer: treasury.publicKey,
                authority: treasury.publicKey,
                merkleTree: treeAccount.publicKey,
                treeAuthority,
                compressionProgram: new PublicKey("8Ed9Jimrz4istGe3C9QViAUsvBxTUof7MiFyJsAmpVy1"),
                logWrapper: SPL_NOOP_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .instruction()
    );

    // send transaction
    await sendAndConfirmTransaction(program.provider.connection, tx, [treasury, treeAccount]);
}