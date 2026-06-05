import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useMobileWallet } from "../../hooks/useMobileWallet";
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
    const { account, connect, signMessage } = useMobileWallet();

    const [walletAuthenticated, setWalletAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    // Address from stored user object — set for both email (custodial) and Phantom users
    const [storedAddress, setStoredAddress] = useState<string>("");

    // Prefer the live MWA account address; fall back to custodial address from stored user
    const walletAddress = account?.address?.toBase58() ?? storedAddress;

    const {
        username,
        balance,
        onTxHistory,
        onSettings,
        openChart,
    } = useWalletLogic(walletAddress);

    useEffect(() => {
        async function restore() {
            try {
                const [token, userRaw] = await Promise.all([
                    AsyncStorage.getItem("token"),
                    AsyncStorage.getItem("user"),
                ]);
                if (token) setWalletAuthenticated(true);
                if (userRaw) {
                    const user = JSON.parse(userRaw);
                    if (user?.address) setStoredAddress(user.address);
                }
            } catch (err) {
                console.error("Wallet session restore failed", err);
            } finally {
                setLoading(false);
            }
        }
        restore();
    }, []);

    const handleWalletLogin = async () => {
        try {
            // connect() opens Phantom via MWA and returns the account
            const walletAccount = account ?? await connect();
            await loginWithWallet(
                walletAccount,
                (msg: Uint8Array) => signMessage(msg) as Promise<Uint8Array>,
            );
            setWalletAuthenticated(true);
        } catch (err) {
            console.error("Wallet login failed:", err);
        }
    };

    if (loading) return <ActivityIndicator style={styles.center} color="#E8622A" />;

    // Only shown to users who have no token at all (neither email nor wallet login)
    if (!walletAuthenticated) {
        return (
            <View style={styles.center}>
                <TouchableOpacity onPress={handleWalletLogin} style={styles.connectBtn}>
                    <Text style={styles.connectText}>Connect Wallet</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const totalUSD = balance?.totalUSD ?? 0;
    const tokenList = balance?.tokens ?? [];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["rgba(52,211,153,0.14)", "rgba(52,211,153,0.04)", "transparent"]}
                locations={[0, 0.4, 0.75]}
                style={styles.topGradient}
                pointerEvents="none"
            />
            <WalletHeader
                username={username}
                onSettings={onSettings}
                onTxHistory={onTxHistory}
            />

            <WalletControlPanel
                balance={totalUSD.toFixed(2)}
                onReceive={() => navigation.navigate("Wallet-recv", { tokens: tokenList })}
                onSend={() => navigation.navigate("Wallet-send", { tokens: tokenList, walletAddress })}
                onSwap={() => navigation.navigate("Wallet-swap", { tokens: tokenList, walletAddress })}
                onBuy={() => navigation.navigate("Wallet-buy", { tokens: tokenList, walletAddress })}
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
    container: { flex: 1, backgroundColor: "#2E2D2D" },
    topGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 420,
    },
    list: { padding: 16, paddingBottom: 100 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#2E2D2D" },
    connectBtn: {
        backgroundColor: "#E8622A",
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 14,
    },
    connectText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
