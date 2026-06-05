export async function getSwapQuote(
    inputMint: string,
    outputMint: string,
    amount: number,   // human-readable amount
    decimals: number, // input token decimals (e.g. 9 for SOL, 6 for USDC)
) {
    const rawAmount = Math.floor(amount * Math.pow(10, decimals));
    const res = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${rawAmount}&slippageBps=50`
    );
    if (!res.ok) throw new Error(`Jupiter quote failed: ${res.status}`);
    return res.json();
}

export async function buildSwapTx(quoteResponse: any, userPublicKey: string) {
    const res = await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteResponse, userPublicKey }),
    });
    if (!res.ok) throw new Error(`Jupiter swap build failed: ${res.status}`);
    const json = await res.json();
    return json.swapTransaction as string; // base64 VersionedTransaction
}
