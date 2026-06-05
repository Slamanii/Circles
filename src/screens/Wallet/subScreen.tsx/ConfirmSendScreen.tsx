import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useMobileWallet } from "../../../hooks/useMobileWallet";
import { sendSol, sendSplToken } from "../../../services/wallet/send";
import { Token } from "../../../../shared/Types";

const SOL_MINT = "So11111111111111111111111111111111111111112";

function Row({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue} numberOfLines={2}>{value}</Text>
        </View>
    );
}

export default function ConfirmSendScreen({ navigation, route }: any) {
    const { token, amount, address, walletAddress }: {
        token: Token; amount: string; address: string; walletAddress: string;
    } = route.params;

    const { account, signAndSendTransaction } = useMobileWallet() as any;
    const [loading, setLoading] = useState(false);

    const effectiveAddress = account?.address?.toBase58() ?? walletAddress;
    const canSign = !!account && typeof signAndSendTransaction === "function";

    const handleSend = async () => {
        if (!canSign) {
            Alert.alert("Phantom required", "Connect your Phantom wallet to send tokens.");
            return;
        }
        setLoading(true);
        try {
            const isSol = token.id === SOL_MINT;
            const sig = isSol
                ? await sendSol({
                    fromAddress: effectiveAddress,
                    signAndSend: signAndSendTransaction,
                    destination: address,
                    amount: parseFloat(amount),
                })
                : await sendSplToken({
                    fromAddress: effectiveAddress,
                    signAndSend: signAndSendTransaction,
                    destination: address,
                    mint: token.id,
                    amount: parseFloat(amount),
                    decimals: token.decimals,
                });

            Alert.alert("Sent!", `Transaction: ${sig.slice(0, 12)}...`, [
                { text: "Done", onPress: () => navigation.popToTop() },
            ]);
        } catch (err: any) {
            Alert.alert("Send failed", err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Confirm Send</Text>

            <View style={styles.card}>
                <Row label="Token"  value={`${token.name} (${token.symbol})`} />
                <View style={styles.divider} />
                <Row label="Amount" value={`${amount} ${token.symbol}`} />
                <View style={styles.divider} />
                <Row label="To"     value={address} />
                <View style={styles.divider} />
                <Row label="From"   value={effectiveAddress} />
            </View>

            {!canSign && (
                <View style={styles.warningRow}>
                    <Ionicons name="warning-outline" size={16} color="#F59E0B" />
                    <Text style={styles.warningText}>Connect Phantom to sign this transaction.</Text>
                </View>
            )}

            <TouchableOpacity
                style={[styles.sendBtn, (loading || !canSign) && styles.disabled]}
                onPress={handleSend}
                disabled={loading || !canSign}
            >
                {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.sendText}>Confirm & Send</Text>
                }
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#2E2D2D", paddingHorizontal: 16 },
    backBtn:   { marginTop: 56, marginBottom: 8 },
    backText:  { color: "#fff", fontSize: 22 },
    title:     { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 24 },
    card: {
        backgroundColor: "#3A3939",
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    rowLabel: { color: "#6B7280", fontSize: 13, fontWeight: "600", flex: 0 },
    rowValue:  { color: "#fff", fontSize: 13, fontWeight: "500", flex: 1, textAlign: "right" },
    divider:   { height: StyleSheet.hairlineWidth, backgroundColor: "#4B4A4A", marginHorizontal: 16 },
    warningRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 16,
    },
    warningText: { color: "#F59E0B", fontSize: 13 },
    sendBtn: {
        backgroundColor: "#E8622A",
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: "center",
        position: "absolute",
        bottom: 40,
        left: 16,
        right: 16,
    },
    disabled:  { opacity: 0.4 },
    sendText:  { color: "#fff", fontWeight: "700", fontSize: 16 },
});
