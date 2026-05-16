export async function fetchChartData(tokenId: string) {

    const url = "";

    const response = await fetch(url);

    if (!response.ok) {

        throw new Error("Failed t o fecth chart Data");

    }

    const data = await response.json();

    return data.prices.map((price: number[]) => ({
        time: price[0],
        value: price[1],
    }));
}