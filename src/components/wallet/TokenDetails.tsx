import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TokenDetailsType } from "../../../shared/Types";
import { formatFiat } from "../../services/currency";

const SYMBOL_COLORS: Record<string, string> = {
    SOL:  "#9945FF",
    ETH:  "#627EEA",
    USDT: "#26A17B",
    USDC: "#2775CA",
    BTC:  "#F7931A",
};

const JUP_KNOWN = new Set([
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
    "So11111111111111111111111111111111111111112",    // SOL
]);

function TokenLogo({ id, symbol, logoURI }: { id: string; symbol: string; logoURI?: string }) {
    const [imgError, setImgError] = useState(false);

    // Only trust the img.jup.ag URL for tokens we know are in their catalogue
    const useRemote = (logoURI && !imgError) && JUP_KNOWN.has(id);

    if (useRemote) {
        return (
            <Image
                source={{ uri: logoURI }}
                style={styles.logo}
                onError={() => setImgError(true)}
            />
        );
    }

    const bg = SYMBOL_COLORS[symbol?.toUpperCase()] ?? "#555";
    return (
        <View style={[styles.logo, { backgroundColor: bg }]}>
            <Text style={styles.logoText}>{symbol?.[0]?.toUpperCase() ?? "?"}</Text>
        </View>
    );
}

function formatBalance(balance: number, symbol: string): string {
    if (balance === 0) return `0 ${symbol}`;
    if (balance < 0.0001) return `${balance.toExponential(2)} ${symbol}`;
    if (balance < 1) return `${balance.toFixed(4)} ${symbol}`;
    return `${balance.toFixed(2)} ${symbol}`;
}

export function TokenDetails({ onPress, token, currency = "USD", ngnRate = 0 }: TokenDetailsType) {
    const priceStr = (currency === "NGN" && ngnRate === 0)
        ? "Rate unavailable"
        : formatFiat(token.priceInUSD ?? 0, currency, ngnRate);

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
            <TokenLogo id={token.id} symbol={token.symbol} logoURI={token.logoURI} />

            <View style={styles.info}>
                <Text style={styles.name}>{token.name}</Text>
                <Text style={styles.sub}>{formatBalance(token.balance, token.symbol)}</Text>
            </View>

            <Text style={styles.price}>{priceStr}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#3A3939",
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 10,
    },
    logo: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    logoText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    info: {
        flex: 1,
        gap: 4,
    },
    name: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
    },
    sub: {
        color: "#9CA3AF",
        fontSize: 12,
    },
    price: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
    },
});
