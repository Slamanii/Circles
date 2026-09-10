import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TokenDetails } from "../../components/wallet/TokenDetails";
import { WalletControlPanel } from "../../components/wallet/WalletControlPanel";
import { useMobileWallet } from "../../hooks/useMobileWallet";
import { useWalletLogic } from "../../hooks/useWallet";
import {
    ActiveWallet,
    CUSTODIAL,
    fetchLinkedWallets,
    getActiveWallet,
    linkWallet,
    setActiveWallet,
} from "../../hooks/useWalletConnection";
import { authenticate, getBiometricEnabled } from "../../services/biometric";
import { Currency, fetchNGNRate, formatFiat, getPreferredCurrency } from "../../services/currency";
import { WalletHeader } from "./walletheader";

// Survives tab switches; must be reset explicitly on logout
let sessionUnlocked = false;
export function resetBiometricSession() { sessionUnlocked = false; }

function shortAddr(address: string) {
    return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

type PendingAccount = { address: { toBase58: () => string } };

export default function WalletScreen() {
    const navigation = useNavigation<any>();
    const { account, connect, signMessage } = useMobileWallet();

    const [activeWallet, setActiveWalletState] = useState<ActiveWallet | null>(null);
    const [linkedWallets, setLinkedWallets]    = useState<{ address: string; created_at: string }[]>([]);
    const [pendingAccount, setPendingAccount]  = useState<PendingAccount | null>(null);
    const [connecting, setConnecting]          = useState(false);
    const [linking, setLinking]               = useState(false);
    const [loading, setLoading]               = useState(true);
    const [biometricLocked, setBiometricLocked] = useState(false);
    const [storedAddress, setStoredAddress]   = useState("");
    const [currency, setCurrency]             = useState<Currency>("USD");
    const [ngnRate, setNgnRate]               = useState(0);

    const walletAddress =
        activeWallet === CUSTODIAL ? storedAddress
        : activeWallet ?? "";

    const { username, balance, onTxHistory, onSettings, openChart } = useWalletLogic(walletAddress);

    // Focus: re-check the wallet gate + biometric + currency every time this tab is opened,
    // so "Switch Wallet" in Settings (which clears the stored choice) re-shows the gate.
    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            async function load() {
                try {
                    const [chosen, userRaw, wallets, cur] = await Promise.all([
                        getActiveWallet(),
                        AsyncStorage.getItem("user"),
                        fetchLinkedWallets().catch(() => []),
                        getPreferredCurrency(),
                    ]);
                    if (cancelled) return;

                    setActiveWalletState(chosen as ActiveWallet | null);
                    setLinkedWallets(wallets);
                    if (userRaw) {
                        const user = JSON.parse(userRaw);
                        if (user?.address) setStoredAddress(user.address);
                    }
                    setCurrency(cur);
                    if (cur === "NGN") setNgnRate(await fetchNGNRate());
                    else setNgnRate(0);
                } catch (err) {
                    console.error("Wallet gate check failed", err);
                } finally {
                    if (!cancelled) setLoading(false);
                }
            }
            load();

            if (!sessionUnlocked) {
                getBiometricEnabled().then(enabled => {
                    if (!cancelled && enabled) setBiometricLocked(true);
                });
            }

            return () => {
                cancelled = true;
                setPendingAccount(null);
            };
        }, [])
    );

    const handleBiometricUnlock = async () => {
        const passed = await authenticate();
        if (passed) {
            sessionUnlocked = true;
            setBiometricLocked(false);
        }
    };

    const handleLoginCustodial = async () => {
        await setActiveWallet(CUSTODIAL);
        setActiveWalletState(CUSTODIAL);
    };

    const handleUseLinkedWallet = async (address: string) => {
        await setActiveWallet(address);
        setActiveWalletState(address);
    };

    // Step 1: connect via MWA (redirects to Phantom/Solflare, user picks an account
    // there) — nothing is signed or sent to the backend yet, just surfaced for confirmation.
    const handleStartLink = async () => {
        setConnecting(true);
        try {
            const walletAccount = account ?? await connect();
            setPendingAccount(walletAccount);
        } catch (err) {
            console.error("Wallet connect failed:", err);
        } finally {
            setConnecting(false);
        }
    };

    // Step 2: user confirmed the shown address — now sign the ownership message and link it.
    const handleConfirmLink = async () => {
        if (!pendingAccount) return;
        setLinking(true);
        try {
            const result = await linkWallet(
                pendingAccount,
                (msg: Uint8Array) => signMessage(msg) as Promise<Uint8Array>,
            );
            if (!result.alreadyLinked) {
                setLinkedWallets(prev => [...prev, { address: result.address, created_at: new Date().toISOString() }]);
            }
            setActiveWalletState(result.address);
            setPendingAccount(null);
        } catch (err) {
            console.error("Wallet link failed:", err);
        } finally {
            setLinking(false);
        }
    };

    const handleCancelLink = () => setPendingAccount(null);

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

    if (pendingAccount) return (
        <View style={styles.center}>
            <Ionicons name="wallet-outline" size={40} color="#E8622A" />
            <Text style={styles.gateTitle}>Link this wallet?</Text>
            <Text style={styles.pendingAddress}>{shortAddr(pendingAccount.address.toBase58())}</Text>
            <TouchableOpacity style={styles.connectBtn} onPress={handleConfirmLink} disabled={linking}>
                {linking
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.connectText}>Confirm & Link</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.connectBtnSecondary} onPress={handleCancelLink} disabled={linking}>
                <Text style={styles.connectTextSecondary}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );

    if (!activeWallet) return (
        <View style={styles.center}>
            <Text style={styles.gateTitle}>Choose a wallet</Text>
            <TouchableOpacity style={styles.connectBtn} onPress={handleLoginCustodial}>
                <Text style={styles.connectText}>Login to Wallet</Text>
            </TouchableOpacity>
            {linkedWallets.map(w => (
                <TouchableOpacity
                    key={w.address}
                    style={styles.connectBtnSecondary}
                    onPress={() => handleUseLinkedWallet(w.address)}
                >
                    <Text style={styles.connectTextSecondary}>{shortAddr(w.address)}</Text>
                </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.connectBtnSecondary} onPress={handleStartLink} disabled={connecting}>
                {connecting
                    ? <ActivityIndicator color="#E8622A" />
                    : <Text style={styles.connectTextSecondary}>Link Wallet</Text>}
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
                onSend={() => navigation.navigate("Wallet-send", { tokens: tokenList, walletAddress, activeWallet })}
                onSwap={() => navigation.navigate("Wallet-swap", { tokens: tokenList, walletAddress, activeWallet })}
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
    center:      { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#2E2D2D", gap: 12 },
    gateTitle:   { color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 4 },
    pendingAddress: { color: "#9CA3AF", fontSize: 14, marginBottom: 12 },
    connectBtn:  { backgroundColor: "#E8622A", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
    connectText: { color: "#fff", fontWeight: "700", fontSize: 15 },
    connectBtnSecondary: {
        backgroundColor: "#3A3939",
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 14,
        minWidth: 160,
        alignItems: "center",
    },
    connectTextSecondary: { color: "#fff", fontWeight: "600", fontSize: 14 },
    lockText:    { color: "#9CA3AF", fontSize: 16, marginTop: 16, marginBottom: 24 },
});
