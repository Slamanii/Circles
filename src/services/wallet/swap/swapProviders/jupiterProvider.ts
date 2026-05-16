
export async function buildSwaptx(route: any, userPublicKey: string) {
    
    const res = await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            route,
            userPublicKey
        })
    });

    return res.json();
}
