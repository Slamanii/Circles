import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { fetchWalletTxHistory, ParsedTx } from "../../../services/wallet/history";

export default function TxHistoryScreen() {
    const navigation = useNavigation<any>();
    const { account } = useMobileWallet();
    const [txs, setTxs] = useState<ParsedTx[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!account?.publicKey) return;
        fetchWalletTxHistory(account.publicKey.toBase58())
            .then(setTxs)
            .catch((err) => console.error("TxHistory error:", err))
            .finally(() => setLoading(false));
    }, [account?.publicKey]);

    if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#60A5FA" />;

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
                <Text style={{ color: "white", fontSize: 18 }}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Transaction History</Text>

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
                            <Text style={styles.sig} numberOfLines={1}>
                                {item.signature}
                            </Text>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F172A", padding: 16 },
    back: { marginTop: 50, marginBottom: 16 },
    title: { color: "white", fontSize: 22, fontWeight: "bold", marginBottom: 16 },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderColor: "#1E293B",
    },
    type: { color: "white", fontWeight: "600" },
    sig: { color: "#64748B", fontSize: 11, marginTop: 2 },
    meta: { color: "#475569", fontSize: 11, marginTop: 2 },
    amount: { color: "#60A5FA", fontWeight: "600" },
    empty: { color: "#64748B", textAlign: "center", marginTop: 60 },
});
