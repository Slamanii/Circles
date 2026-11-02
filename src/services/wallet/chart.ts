const SOL_MINT = "So11111111111111111111111111111111111111112";

// CoinGecko's by-contract endpoint resolves an SPL mint address directly to
// its market data — no static mint→coingeckoId lookup table needed. SOL
// itself isn't an SPL-token contract on CoinGecko, so it uses the plain
// coin-id endpoint instead.
export async function fetchChartData(mintOrTokenId: string, days: number = 7) {
    const url = mintOrTokenId === SOL_MINT
        ? `https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=${days}`
        : `https://api.coingecko.com/api/v3/coins/solana/contract/${mintOrTokenId}/market_chart/?vs_currency=usd&days=${days}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Failed to fetch chart data");
    }

    const data = await response.json();

    return (data.prices ?? []).map((price: number[]) => ({
        time: price[0],
        value: price[1],
    }));
}
