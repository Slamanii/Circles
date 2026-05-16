
export async function getSwapQuote(
    inputMint: string,
    outputMint: string,
    amount: number
) {
    const res = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}`
    );

    return res.json();
}