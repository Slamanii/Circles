import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TokenDetails } from "../../components/wallet/TokenDetails";
import { WalletControlPanel } from "../../components/wallet/WalletControlPanel";
import { useMobileWallet } from "../../hooks/useMobileWallet";
import { useWalletLogic } from "../../hooks/useWallet";
import { loginWithWallet } from "../../hooks/useWalletConnection";
import { authenticate, getBiometricEnabled } from "../../services/biometric";
import { Currency, fetchNGNRate, formatFiat, getPreferredCurrency } from "../../services/currency";
import { WalletHeader } from "./walletheader";

// Survives tab switches; must be reset explicitly on logout
let sessionUnlocked = false;
export function resetBiometricSession() { sessionUnlocked = false; }

export default function WalletScreen() {
    const navigation = useNavigation<any>();
    const { account, connect, signMessage } = useMobileWallet();

    const [walletAuthenticated, setWalletAuthenticated] = useState(false);
    const [loading, setLoading]               = useState(true);
    const [biometricLocked, setBiometricLocked] = useState(false);
    const [storedAddress, setStoredAddress]   = useState("");
    const [currency, setCurrency]             = useState<Currency>("USD");
    const [ngnRate, setNgnRate]               = useState(0);

    // Prefer the live MWA account address; fall back to custodial stored address
    const walletAddress = account?.address?.toBase58() ?? storedAddress;

    const { username, balance, onTxHistory, onSettings, openChart } = useWalletLogic(walletAddress);

    // Mount: restore session + initial currency load
    useEffect(() => {
        async function restore() {
            try {
                const [token, userRaw, cur] = await Promise.all([
                    AsyncStorage.getItem("token"),
                    AsyncStorage.getItem("user"),
                    getPreferredCurrency(),
                ]);
                if (token) setWalletAuthenticated(true);
                if (userRaw) {
                    const user = JSON.parse(userRaw);
                    if (user?.address) setStoredAddress(user.address);
                }
                setCurrency(cur);
                if (cur === "NGN") setNgnRate(await fetchNGNRate());
            } catch (err) {
                console.error("Wallet session restore failed", err);
            } finally {
                setLoading(false);
            }
        }
        restore();
    }, []);

    // Focus: re-check biometric gate + re-read currency (user may have changed it in settings)
    useFocusEffect(
        useCallback(() => {
            if (!sessionUnlocked) {
                getBiometricEnabled().then(enabled => {
                    if (enabled) setBiometricLocked(true);
                });
            }
            getPreferredCurrency().then(async cur => {
                setCurrency(cur);
                if (cur === "NGN") setNgnRate(await fetchNGNRate());
                else setNgnRate(0);
            });
        }, [])
    );

    const handleBiometricUnlock = async () => {
        const passed = await authenticate();
        if (passed) {
            sessionUnlocked = true;
            setBiometricLocked(false);
        }
    };

    const handleWalletLogin = async () => {
        try {
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

    if (biometricLocked) return (
        <View style={styles.center}>
            <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
            <Text style={styles.lockText}>Wallet locked</Text>
            <TouchableOpacity style={styles.connectBtn} onPress={handleBiometricUnlock}>
                <Text style={styles.connectText}>Unlock</Text>
            </TouchableOpacity>
        </View>
    );

    if (!walletAuthenticated) return (
        <View style={styles.center}>
            <TouchableOpacity onPress={handleWalletLogin} style={styles.connectBtn}>
                <Text style={styles.connectText}>Connect Wallet</Text>
            </TouchableOpacity>
        </View>
    );

    const sol       = balance?.sol ?? 0;
    const totalUSD  = balance?.totalUSD ?? 0;
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
                solDisplay={`${sol.toFixed(4)} SOL`}
                fiatDisplay={currency === "NGN" && ngnRate === 0
                    ? "Rate unavailable"
                    : formatFiat(totalUSD, currency, ngnRate)}
                onReceive={() => navigation.navigate("Wallet-recv", { tokens: tokenList })}
                onSend={() => navigation.navigate("Wallet-send", { tokens: tokenList, walletAddress })}
                onSwap={() => navigation.navigate("Wallet-swap", { tokens: tokenList, walletAddress })}
                onBuy={() => navigation.navigate("Wallet-buy", { tokens: tokenList, walletAddress })}
            />
            <FlatList
                data={tokenList}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item }) => (
                    <TokenDetails
                        token={item}
                        currency={currency}
                        ngnRate={ngnRate}
                        onPress={() => openChart(item)}
                    />
                )}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container:   { flex: 1, backgroundColor: "#2E2D2D" },
    topGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 420 },
    list:        { padding: 16, paddingBottom: 100 },
    center:      { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#2E2D2D" },
    connectBtn:  { backgroundColor: "#E8622A", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
    connectText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    lockText:    { color: "#9CA3AF", fontSize: 16, marginTop: 16, marginBottom: 24 },
});
