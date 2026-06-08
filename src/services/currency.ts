import AsyncStorage from "@react-native-async-storage/async-storage";

export type Currency = "USD" | "NGN";

const CURRENCY_KEY = "wallet_preferred_currency";
const CNGN_MINT    = process.env.EXPO_PUBLIC_CNGN_MINT!;

export async function getPreferredCurrency(): Promise<Currency> {
    const val = await AsyncStorage.getItem(CURRENCY_KEY);
    return (val as Currency) ?? "USD";
}

export async function setPreferredCurrency(c: Currency): Promise<void> {
    await AsyncStorage.setItem(CURRENCY_KEY, c);
}

// Returns how many NGN equal 1 USD, derived from cNGN's USD price on Jupiter.
// Since cNGN is 1:1 with NGN, price of cNGN in USD = 1/rate.
export async function fetchNGNRate(): Promise<number> {
    try {
        const res  = await fetch(`https://lite-api.jup.ag/price/v2?ids=${CNGN_MINT}`);
        const json = await res.json();
        const cNGNpriceUSD: number = json.data?.[CNGN_MINT]?.price ?? 0;
        return cNGNpriceUSD > 0 ? 1 / cNGNpriceUSD : 0;
    } catch {
        return 0;
    }
}

export function formatFiat(usdAmount: number, currency: Currency, ngnRate: number): string {
    if (currency === "NGN") {
        const ngn = usdAmount * ngnRate;
        return "₦" + ngn.toLocaleString("en-NG", { maximumFractionDigits: 0 });
    }
    return "$" + usdAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const CURRENCY_LABELS: Record<Currency, string> = {
    USD: "US Dollar (USD)",
    NGN: "Nigerian Naira (NGN)",
};
