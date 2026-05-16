export async function buyWithMoonpay(req: any) {

    const url = new URL("https://buy.moonpay.com");

    url.searchParams.append("apiKey", process.env.MOONPAY_PUBLIC_KEY!);
    url.searchParams.append("currencyCode", req.asset);
    url.searchParams.append("walletAddress", req.walletAddress);
    url.searchParams.append("baseCurrencyAmount", req.amount.toString());

    return {
        provider: "MOONPAY",
        url: url.toString(),
    };
}