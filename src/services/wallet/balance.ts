import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Token } from "../../../shared/Types";

const HELIUS_RPC = process.env.EXPO_PUBLIC_HELIUS_RPC_URL!;
const connection = new Connection(HELIUS_RPC);
const SOL_MINT = "So11111111111111111111111111111111111111112";

// Default tokens always shown — zero balance if the wallet doesn't hold them
const DEFAULT_SPL: { id: string; name: string; symbol: string; decimals: number }[] = [
    { id: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", name: "USD Coin",      symbol: "USDC", decimals: 6 },
    { id: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", name: "Tether USD",    symbol: "USDT", decimals: 6 },
    { id: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs", name: "Wrapped Ether", symbol: "ETH",  decimals: 8 },
    // cNGN injected at runtime from env so the address stays out of source
].filter(m => !!m.id);

async function fetchSolPriceUSD(): Promise<number> {
    try {
        const resp = await fetch(`https://lite-api.jup.ag/price/v2?ids=${SOL_MINT}`);
        const json = await resp.json();
        return json.data?.[SOL_MINT]?.price ?? 0;
    } catch {
        return 0;
    }
}

async function fetchAssetsByOwner(ownerAddress: string): Promise<any[]> {
    try {
        const resp = await fetch(HELIUS_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: "fuego-wallet",
                method: "getAssetsByOwner",
                params: {
                    ownerAddress,
                    page: 1,
                    limit: 1000,
                    displayOptions: { showFungible: true },
                },
            }),
        });
        const json = await resp.json();
        return json.result?.items ?? [];
    } catch {
        return [];
    }
}

export async function fetchSolBalances(walletAddress: string): Promise<{ sol: number; tokens: Token[]; totalUSD: number }> {
    const publicKey = new PublicKey(walletAddress);

    const [solLamports, solPriceUSD, dasAssets] = await Promise.all([
        connection.getBalance(publicKey),
        fetchSolPriceUSD(),
        fetchAssetsByOwner(walletAddress),
    ]);

    const solAmount = solLamports / 1_000_000_000;

    const solToken: Token = {
        id: SOL_MINT,
        name: "Solana",
        symbol: "SOL",
        coingeckoId: "solana",
        logoURI: `https://img.jup.ag/tokens/${SOL_MINT}`,
        tokenAccount: walletAddress,
        decimals: 9,
        balance: solAmount,
        priceInSol: solAmount,
        priceInUSD: solAmount * solPriceUSD,
        chart: null,
    };

    const splTokens: Token[] = dasAssets
        .filter((a: any) => a.interface === "FungibleToken" || a.interface === "FungibleAsset")
        .map((a: any) => {
            const info = a.token_info ?? {};
            const meta = a.content?.metadata ?? {};
            const links = a.content?.links ?? {};
            const decimals = info.decimals ?? 0;
            const rawBalance = info.balance ?? 0;
            const uiBalance = rawBalance / Math.pow(10, decimals);
            const pricePerToken: number = info.price_info?.price_per_token ?? 0;
            const totalUSD = pricePerToken * uiBalance;
            const priceInSol = solPriceUSD > 0 ? (pricePerToken / solPriceUSD) * uiBalance : 0;

            // ATA is deterministic — no RPC call needed
            let tokenAccount: string | undefined;
            try {
                tokenAccount = getAssociatedTokenAddressSync(
                    new PublicKey(a.id),
                    publicKey,
                ).toBase58();
            } catch { /* leave undefined */ }

            return {
                id: a.id,
                name: meta.name || info.symbol || a.id.slice(0, 6),
                symbol: info.symbol || meta.symbol || "?",
                coingeckoId: "",
                logoURI: links.image || `https://img.jup.ag/tokens/${a.id}`,
                tokenAccount,
                decimals,
                balance: uiBalance,
                priceInSol,
                priceInUSD: totalUSD,
                chart: null,
            };
        })
        .filter((t: Token) => t.balance > 0);

    // Build the full default list at runtime so cNGN mint comes from env
    const cNGNMint = process.env.EXPO_PUBLIC_CNGN_MINT;
    const allDefaults = [
        ...DEFAULT_SPL,
        ...(cNGNMint && !cNGNMint.startsWith("REPLACE")
            ? [{ id: cNGNMint, name: "cNGN", symbol: "cNGN", decimals: 6 }]
            : []),
    ];

    // Inject defaults that the wallet doesn't currently hold (shown with 0 balance)
    const heldIds = new Set(splTokens.map(t => t.id));
    const zeroDefaults: Token[] = allDefaults
        .filter(d => !heldIds.has(d.id))
        .map(d => ({
            id: d.id,
            name: d.name,
            symbol: d.symbol,
            coingeckoId: "",
            logoURI: `https://img.jup.ag/tokens/${d.id}`,
            tokenAccount: undefined,
            decimals: d.decimals,
            balance: 0,
            priceInSol: 0,
            priceInUSD: 0,
            chart: null,
        }));

    // Order: SOL → zero defaults → held SPL tokens
    const tokens = [solToken, ...zeroDefaults, ...splTokens];
    const totalUSD = tokens.reduce((sum, t) => sum + t.priceInUSD, 0);

    return { sol: solAmount, tokens, totalUSD };
}

export function fetchTokenAddresses(walletAddress: string, mintAddress: string) {
    const ata = getAssociatedTokenAddressSync(
        new PublicKey(mintAddress),
        new PublicKey(walletAddress),
    );
    return { ata };
}
