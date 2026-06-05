import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMobileWallet } from "../../../hooks/useMobileWallet";
import { fetchWalletTxHistory, ParsedTx } from "../../../services/wallet/history";

export default function TxHistoryScreen() {
    const navigation = useNavigation<any>();
    const { account } = useMobileWallet();
    const [txs, setTxs] = useState<ParsedTx[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                // Prefer live MWA address, fall back to stored user address (email users)
                let address = account?.address?.toBase58() ?? null;
                if (!address) {
                    const userRaw = await AsyncStorage.getItem("user");
                    address = userRaw ? JSON.parse(userRaw)?.address ?? null : null;
                }
                if (!address) {
                    setError("No wallet address found");
                    return;
                }
                const data = await fetchWalletTxHistory(address);
                setTxs(data);
            } catch (err) {
                console.error("TxHistory error:", err);
                setError("Failed to load transactions");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [account?.address]);

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
                <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Transaction History</Text>

            {loading ? (
                <ActivityIndicator style={{ flex: 1 }} color="#60A5FA" />
            ) : error ? (
                <Text style={styles.empty}>{error}</Text>
            ) : (
                <FlatList
                    data={txs}
                    keyExtractor={(item) => item.signature}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    ListEmptyComponent={
                        <Text style={styles.empty}>No transactions found</Text>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.type}>{item.type}</Text>
                                <Text style={styles.sig} numberOfLines={1}>{item.signature}</Text>
                                <Text style={styles.meta}>
                                    {item.timestamp
                                        ? new Date(item.timestamp * 1000).toLocaleDateString()
                                        : "—"}
                                </Text>
                            </View>
                            {item.amount != null && (
                                <Text style={styles.amount}>
                                    {(item.amount / 1e9).toFixed(4)} SOL
                                </Text>
                            )}
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#424040", padding: 16 },
    back: { marginTop: 50, marginBottom: 16 },
    backText: { color: "white", fontSize: 18 },
    title: { color: "white", fontSize: 22, fontWeight: "bold", marginBottom: 16 },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderColor: "rgba(255,255,255,0.08)",
    },
    type: { color: "white", fontWeight: "600" },
    sig: { color: "#64748B", fontSize: 11, marginTop: 2 },
    meta: { color: "#475569", fontSize: 11, marginTop: 2 },
    amount: { color: "#60A5FA", fontWeight: "600" },
    empty: { color: "#64748B", textAlign: "center", marginTop: 60 },
});
