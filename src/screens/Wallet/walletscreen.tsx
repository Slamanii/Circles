import { useNavigation } from "@react-navigation/native";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, Text, View } from "react-native";
import { TokenDetails } from "../../components/wallet/TokenDetails";
import { WalletControlPanel } from "../../components/wallet/WalletControlPanel";
import { useWalletLogic } from "../../hooks/useWallet";
import { loginWithWallet } from "../../hooks/useWalletConnection";
import { WalletHeader } from "./walletheader";

export default function WalletScreen() {
    const navigation = useNavigation<any>();
    const { account, connect } = useMobileWallet();
    const walletAddress = account?.publicKey?.toBase58() ?? "";

    const [walletAuthenticated, setWalletAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    const {
        username,
        balance,
        onReceive,
        onTxHistory,
        onSettings,
        openChart,
    } = useWalletLogic(walletAddress);

    useEffect(() => {
        AsyncStorage.getItem("wallet_token")
            .then((token) => { if (token) setWalletAuthenticated(true); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleWalletLogin = async () => {
        try {
            const walletAccount = account ?? await connect();
            const session = await loginWithWallet(walletAccount);
            await AsyncStorage.setItem("wallet_token", session.token);
            setWalletAuthenticated(true);
        } catch (err) {
            console.error("Wallet login failed:", err);
        }
    };

    if (loading) return <ActivityIndicator style={styles.center} />;

    if (!walletAuthenticated) {
        return (
            <View style={styles.center}>
                <TouchableOpacity
                    onPress={handleWalletLogin}
                    style={{ backgroundColor: "#3B82F6", padding: 14, borderRadius: 10 }}
                >
                    <Text style={{ color: "white", fontWeight: "600" }}>Connect & Login Wallet</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const solBalance = balance?.sol.toFixed(4) ?? "0.0000";
    const tokenList = balance?.tokens ?? [];

    return (
        <View style={styles.container}>
            <WalletHeader
                username={username}
                onSettings={onSettings}
                onTxHistory={onTxHistory}
            />

            <WalletControlPanel
                balance={solBalance}
                onReceive={onReceive}
                onSend={() => navigation.navigate("Wallet-send", { tokens: tokenList })}
                onSwap={() => navigation.navigate("Wallet-swap", { tokens: tokenList, walletAddress })}
                onBuy={() => navigation.navigate("Wallet-buy", { tokens: tokenList })}
            />

            <FlatList
                data={tokenList}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item }) => (
                    <TokenDetails token={item} onPress={() => openChart(item)} />
                )}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F172A" },
    list: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" },
});
