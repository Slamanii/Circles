

export async function buyWithAzza(req: any) {

    const res = await fetch("https://api.useazza.com/buy", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.AZZA_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            asset: req.asset,
            amount: req.amount,
            walletAddress: req.walletAddress
        })
    });

    return res.json();
}