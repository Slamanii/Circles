import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { buildSwaptx } from "../../../services/wallet/swap/swapProviders/jupiterProvider";
import { getSwapQuote } from "../../../services/wallet/swap/swapService";
import { Token } from "../../../../shared/Types";

export default function SwapScreen({ route }: any) {
    const { tokens, walletAddress, wallet } = route.params;
    const navigation = useNavigation<any>();

    const [fromToken, setFromToken] = useState<Token | null>(null);
    const [toToken, setToToken] = useState<Token | null>(null);
    const [amount, setAmount] = useState("");
    const [quote, setQuote] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const step = !fromToken ? "from" : !toToken ? "to" : "confirm";

    const handleGetQuote = async () => {
        if (!fromToken || !toToken || !amount) return;
        setLoading(true);
        try {
            const q = await getSwapQuote(fromToken.id, toToken.id, parseFloat(amount));
            setQuote(q);
        } catch (err: any) {
            Alert.alert("Quote failed", err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSwap = async () => {
        if (!quote || !walletAddress) return;
        setLoading(true);
        try {
            const swapTx = await buildSwaptx(quote, walletAddress);
            // User signs via mobile wallet
            const signed = await wallet.signTransaction(swapTx);
            Alert.alert("Swap submitted", `Tx: ${signed}`);
            navigation.goBack();
        } catch (err: any) {
            Alert.alert("Swap failed", err.message);
        } finally {
            setLoading(false);
        }
    };

    if (step === "from" || step === "to") {
        const label = step === "from" ? "Select token to swap FROM" : "Select token to receive";
        return (
            <View style={{ flex: 1, backgroundColor: "#0F172A", padding: 20 }}>
                <TouchableOpacity onPress={() => step === "to" ? setFromToken(null) : navigation.goBack()} style={{ marginBottom: 16 }}>
                    <Text style={{ color: "white", fontSize: 18 }}>←</Text>
                </TouchableOpacity>
                <Text style={{ color: "white", fontSize: 18, fontWeight: "600", marginBottom: 16 }}>{label}</Text>
                <FlatList
                    data={tokens}
                    keyExtractor={(item: Token) => item.id}
                    renderItem={({ item }: { item: Token }) => (
                        <TouchableOpacity
                            onPress={() => step === "from" ? setFromToken(item) : setToToken(item)}
                            style={{ paddingVertical: 14, borderBottomWidth: 0.5, borderColor: "#1E293B" }}
                        >
                            <Text style={{ color: "white", fontWeight: "600" }}>{item.name}</Text>
                            <Text style={{ color: "#64748B", fontSize: 12 }}>{item.symbol} · Balance: {item.balance}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#0F172A", padding: 20 }}>
            <TouchableOpacity onPress={() => setToToken(null)} style={{ marginBottom: 16 }}>
                <Text style={{ color: "white", fontSize: 18 }}>←</Text>
            </TouchableOpacity>
            <Text style={{ color: "white", fontSize: 18, fontWeight: "600", marginBottom: 20 }}>Confirm Swap</Text>

            <Text style={{ color: "#94A3B8", marginBottom: 4 }}>From: {fromToken!.name}</Text>
            <Text style={{ color: "#94A3B8", marginBottom: 16 }}>To: {toToken!.name}</Text>

            <TextInput
                placeholder="Amount"
                placeholderTextColor="#64748B"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                style={{ backgroundColor: "#1E293B", color: "white", padding: 14, borderRadius: 10, marginBottom: 12 }}
            />

            {quote && (
                <Text style={{ color: "#60A5FA", marginBottom: 12 }}>
                    You receive ≈ {quote.outAmount} {toToken!.symbol}
                </Text>
            )}

            <TouchableOpacity
                onPress={quote ? handleConfirmSwap : handleGetQuote}
                disabled={loading}
                style={{ backgroundColor: loading ? "#334155" : "#3B82F6", padding: 14, borderRadius: 10, alignItems: "center" }}
            >
                {loading ? <ActivityIndicator color="white" /> : (
                    <Text style={{ color: "white", fontWeight: "600" }}>{quote ? "Confirm Swap" : "Get Quote"}</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}
