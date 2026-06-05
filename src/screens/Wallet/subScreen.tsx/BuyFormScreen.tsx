import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Token } from "../../../../shared/Types";

const AZZA_ADDRESS = process.env.EXPO_PUBLIC_AZZA_ADDRESS ?? "—";

export default function BuyFormScreen({ navigation, route }: any) {
    const token: Token = route.params?.token;
    const walletAddress: string = route.params?.walletAddress ?? "";

    const [copiedAzza,   setCopiedAzza]   = useState(false);
    const [copiedWallet, setCopiedWallet] = useState(false);

    const copy = async (text: string, which: "azza" | "wallet") => {
        await Clipboard.setStringAsync(text);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (which === "azza") {
            setCopiedAzza(true);
            setTimeout(() => setCopiedAzza(false), 1500);
        } else {
            setCopiedWallet(true);
            setTimeout(() => setCopiedWallet(false), 1500);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backText}>←</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Buy {token?.symbol ?? "Token"}</Text>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>How it works</Text>
                    <Text style={styles.infoStep}>1. Copy the Azza deposit address below.</Text>
                    <Text style={styles.infoStep}>2. Send any token you hold to that address.</Text>
                    <Text style={styles.infoStep}>3. Azza will credit {token?.name ?? "your chosen token"} to your wallet.</Text>
                </View>

                <Text style={styles.label}>Azza deposit address</Text>
                <TouchableOpacity
                    style={styles.addrRow}
                    onPress={() => copy(AZZA_ADDRESS, "azza")}
                    activeOpacity={0.75}
                >
                    <Text style={styles.addrText} numberOfLines={1}>{AZZA_ADDRESS}</Text>
                    <Ionicons
                        name={copiedAzza ? "checkmark" : "copy-outline"}
                        size={18}
                        color={copiedAzza ? "#34D399" : "#6B7280"}
                    />
                </TouchableOpacity>

                <Text style={styles.label}>Your wallet (where you'll receive)</Text>
                <TouchableOpacity
                    style={styles.addrRow}
                    onPress={() => copy(walletAddress, "wallet")}
                    activeOpacity={0.75}
                >
                    <Text style={styles.addrText} numberOfLines={1}>{walletAddress || "—"}</Text>
                    <Ionicons
                        name={copiedWallet ? "checkmark" : "copy-outline"}
                        size={18}
                        color={copiedWallet ? "#34D399" : "#6B7280"}
                    />
                </TouchableOpacity>

                <Text style={styles.note}>
                    Include your wallet address in the transfer memo or contact Azza support so they know where to send your {token?.symbol ?? "tokens"}.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#2E2D2D" },
    backBtn:   { marginTop: 56, marginLeft: 20, marginBottom: 8 },
    backText:  { color: "#fff", fontSize: 22 },
    title:     { color: "#fff", fontSize: 22, fontWeight: "700", marginLeft: 20, marginBottom: 20 },
    content:   { paddingHorizontal: 16, paddingBottom: 60 },
    infoCard: {
        backgroundColor: "#3A3939",
        borderRadius: 14,
        padding: 16,
        marginBottom: 24,
        gap: 8,
    },
    infoTitle: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 4 },
    infoStep:  { color: "#9CA3AF", fontSize: 13, lineHeight: 20 },
    label: {
        color: "#6B7280",
        fontSize: 11,
        fontWeight: "600",
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    addrRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#3A3939",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 20,
        gap: 10,
    },
    addrText: { flex: 1, color: "#fff", fontSize: 13 },
    note: {
        color: "#6B7280",
        fontSize: 12,
        lineHeight: 18,
        marginTop: 4,
        textAlign: "center",
    },
});
