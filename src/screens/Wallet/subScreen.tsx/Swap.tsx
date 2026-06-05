import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { WalletTokenRow } from "../../../components/wallet/WalletTokenRow";
import { useMobileWallet } from "../../../hooks/useMobileWallet";
import { buildSwapTx, getSwapQuote } from "../../../services/wallet/swap/swapService";
import { Token } from "../../../../shared/Types";

export default function SwapScreen({ route }: any) {
    const { tokens, walletAddress } = route.params ?? {};
    const navigation = useNavigation<any>();
    const { account, signAndSendTransaction } = useMobileWallet() as any;

    const [fromToken, setFromToken] = useState<Token | null>(null);
    const [toToken,   setToToken]   = useState<Token | null>(null);
    const [amount,    setAmount]     = useState("");
    const [quote,     setQuote]      = useState<any>(null);
    const [loading,   setLoading]    = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);

    const effectiveAddress = account?.address?.toBase58() ?? walletAddress;

    // ── Step 1: pick FROM token ───────────────────────────────────────────────
    if (!fromToken) {
        return (
            <View style={styles.container}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Swap Token</Text>

                <FlatList
                    data={tokens}
                    keyExtractor={(t: Token) => t.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }: { item: Token }) => (
                        <WalletTokenRow token={item} onPress={() => { setFromToken(item); setToToken(null); setQuote(null); setAmount(""); }} />
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>No tokens available</Text>}
                />
            </View>
        );
    }

    // ── Step 2: swap form ─────────────────────────────────────────────────────
    const handleGetQuote = async () => {
        if (!fromToken || !toToken || !amount) return;
        setLoading(true);
        try {
            const q = await getSwapQuote(fromToken.id, toToken.id, parseFloat(amount), fromToken.decimals);
            setQuote(q);
        } catch (err: any) {
            Alert.alert("Quote failed", err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!quote || !effectiveAddress) return;
        if (!account) {
            Alert.alert("Phantom required", "Connect your Phantom wallet to execute swaps.");
            return;
        }
        setLoading(true);
        try {
            const swapTxBase64 = await buildSwapTx(quote, effectiveAddress);
            const { Buffer } = await import("buffer");
            const { VersionedTransaction } = await import("@solana/web3.js");
            const txBytes = Buffer.from(swapTxBase64, "base64");
            const tx = VersionedTransaction.deserialize(txBytes);
            await signAndSendTransaction(tx);
            Alert.alert("Swap submitted", "Transaction sent successfully.");
            navigation.goBack();
        } catch (err: any) {
            Alert.alert("Swap failed", err.message);
        } finally {
            setLoading(false);
        }
    };

    const outDisplay = quote
        ? (Number(quote.outAmount) / Math.pow(10, toToken?.decimals ?? 6)).toFixed(4)
        : null;

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => setFromToken(null)} style={styles.backBtn}>
                <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Swap Token</Text>

            <ScrollView contentContainerStyle={styles.formPad} keyboardShouldPersistTaps="handled">

                {/* FROM card */}
                <View style={styles.card}>
                    <WalletTokenRow token={fromToken} />
                    <View style={styles.amountRow}>
                        <TextInput
                            style={styles.amountInput}
                            value={amount}
                            onChangeText={t => { setAmount(t); setQuote(null); }}
                            placeholder="0"
                            placeholderTextColor="#6B7280"
                            keyboardType="decimal-pad"
                        />
                        <TouchableOpacity
                            onPress={() => setAmount(String(fromToken.balance))}
                            style={styles.maxBtn}
                        >
                            <Text style={styles.maxText}>Max</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Directional arrow — decorative only */}
                <View style={styles.arrowWrap}>
                    <View style={styles.arrowCircle}>
                        <Ionicons name="arrow-down" size={20} color="#fff" />
                    </View>
                </View>

                {/* TO token */}
                {toToken ? (
                    <View style={styles.card}>
                        <WalletTokenRow
                            token={toToken}
                            onPress={() => { setToToken(null); setQuote(null); }}
                        />
                        {outDisplay && (
                            <Text style={styles.quoteText}>≈ {outDisplay} {toToken.symbol}</Text>
                        )}
                    </View>
                ) : (
                    <TouchableOpacity style={styles.addBtn} onPress={() => setPickerOpen(true)}>
                        <Ionicons name="add" size={26} color="#fff" />
                    </TouchableOpacity>
                )}

                {/* Action button */}
                {toToken && (
                    <TouchableOpacity
                        style={[styles.confirmBtn, (!amount || loading) && styles.disabled]}
                        onPress={quote ? handleConfirm : handleGetQuote}
                        disabled={!amount || loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={styles.confirmText}>{quote ? "Confirm Swap" : "Get Quote"}</Text>
                        }
                    </TouchableOpacity>
                )}

                {!account && (
                    <Text style={styles.walletNote}>
                        Swap execution requires Phantom. Quotes are available for all wallets.
                    </Text>
                )}
            </ScrollView>

            {/* TO token picker */}
            <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalSheet}>
                        <View style={styles.handle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select token</Text>
                            <TouchableOpacity onPress={() => setPickerOpen(false)}>
                                <Ionicons name="close" size={22} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={(tokens as Token[]).filter((t: Token) => t.id !== fromToken.id)}
                            keyExtractor={(t: Token) => t.id}
                            contentContainerStyle={styles.list}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }: { item: Token }) => (
                                <WalletTokenRow
                                    token={item}
                                    onPress={() => { setToToken(item); setPickerOpen(false); setQuote(null); }}
                                />
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: "#2E2D2D" },
    backBtn:     { marginTop: 56, marginLeft: 20, marginBottom: 8 },
    backText:    { color: "#fff", fontSize: 22 },
    title:       { color: "#fff", fontSize: 22, fontWeight: "700", marginLeft: 20, marginBottom: 20 },
    list:        { paddingHorizontal: 16, paddingBottom: 40 },
    empty:       { color: "#6B7280", textAlign: "center", marginTop: 60, fontSize: 14 },
    formPad:     { paddingHorizontal: 16, paddingBottom: 60 },
    card: {
        backgroundColor: "#3A3939",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 4,
    },
    amountRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingBottom: 14,
        gap: 10,
    },
    amountInput: { flex: 1, color: "#fff", fontSize: 28, fontWeight: "700" },
    maxBtn: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: "#E8622A22",
    },
    maxText:     { color: "#E8622A", fontWeight: "700", fontSize: 13 },
    arrowWrap:   { alignItems: "center", marginVertical: 12 },
    arrowCircle: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: "#E8622A",
        alignItems: "center", justifyContent: "center",
    },
    addBtn: {
        width: 48, height: 48, borderRadius: 24,
        borderWidth: 2, borderColor: "#555",
        alignItems: "center", justifyContent: "center",
        alignSelf: "center", marginVertical: 4,
    },
    quoteText:   { color: "#60A5FA", fontSize: 13, paddingHorizontal: 14, paddingBottom: 12 },
    confirmBtn: {
        marginTop: 28, backgroundColor: "#E8622A",
        borderRadius: 14, paddingVertical: 16, alignItems: "center",
    },
    disabled:    { opacity: 0.45 },
    confirmText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    walletNote:  { color: "#6B7280", fontSize: 12, textAlign: "center", marginTop: 16 },
    modalOverlay: { flex: 1, justifyContent: "flex-end" },
    modalSheet: {
        backgroundColor: "#2E2D2D",
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: "75%", paddingBottom: 40,
    },
    handle: {
        width: 38, height: 4, borderRadius: 2,
        backgroundColor: "#555", alignSelf: "center",
        marginTop: 10, marginBottom: 4,
    },
    modalHeader: {
        flexDirection: "row", alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20, paddingVertical: 14,
    },
    modalTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
