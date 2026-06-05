import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Token } from "../../../shared/Types";

const SYMBOL_COLORS: Record<string, string> = {
    SOL:  "#9945FF",
    ETH:  "#627EEA",
    USDT: "#26A17B",
    USDC: "#2775CA",
    BTC:  "#F7931A",
};

function TokenLogo({ symbol, logoURI }: { symbol: string; logoURI?: string }) {
    const [err, setErr] = useState(false);
    if (logoURI && !err) {
        return (
            <Image
                source={{ uri: logoURI }}
                style={styles.logo}
                onError={() => setErr(true)}
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

function truncate(addr?: string) {
    if (!addr || addr.length <= 12) return addr ?? "—";
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

type Props = {
    token: Token;
    onPress?: () => void;
};

export function WalletTokenRow({ token, onPress }: Props) {
    const [copied, setCopied] = useState(false);
    const addr = token.tokenAccount ?? token.id;

    const handleCopy = async () => {
        await Clipboard.setStringAsync(addr);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <TouchableOpacity
            style={styles.row}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <TokenLogo symbol={token.symbol} logoURI={token.logoURI} />

            <View style={styles.info}>
                <Text style={styles.name}>{token.name}</Text>
                <Text style={styles.addr}>{truncate(addr)}</Text>
            </View>

            <TouchableOpacity
                onPress={handleCopy}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
                <Ionicons
                    name={copied ? "checkmark" : "copy-outline"}
                    size={18}
                    color={copied ? "#34D399" : "#6B7280"}
                />
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#3A3939",
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 10,
        gap: 12,
    },
    logo: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
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
    addr: {
        color: "#6B7280",
        fontSize: 12,
    },
});
