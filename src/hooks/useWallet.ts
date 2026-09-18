import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { fetchSolBalances } from "../services/wallet/balance";
import { getSocket } from "../services/socket";
import { onBalanceChanged } from "../services/wallet/walletEvents";

export function useWalletLogic(walletAddress: string) {
    const navigation = useNavigation<any>();
    const [username, setUsername] = useState("");
    const [balance, setBalance] = useState<{ sol: number; tokens: any[]; totalUSD: number } | null>(null);

    const load = useCallback(async () => {
        try {
            const user = await AsyncStorage.getItem("user");
            if (user) setUsername(JSON.parse(user).username ?? "");
            if (walletAddress) setBalance(await fetchSolBalances(walletAddress));
        } catch (err) {
            console.error("useWalletLogic load error:", err);
        }
    }, [walletAddress]);

    // Refetches every time the Wallet tab regains focus — including returning
    // from Send/Swap/Buy, which pop back here on success — so the balance
    // shown is never stale after a transaction.
    useFocusEffect(useCallback(() => { load(); }, [load]));

    // useFocusEffect only re-invokes on an actual focus/blur transition, not
    // merely because `load`'s identity changed while already focused — so a
    // walletAddress that resolves asynchronously after first mount (the wallet
    // gate check in walletscreen.tsx) would otherwise leave balance unfetched
    // until the *next* focus. This covers that case directly.
    useEffect(() => { if (walletAddress) load(); }, [walletAddress, load]);

    // Fires regardless of focus/navigation state — covers Send/Swap completing
    // while this screen sits blurred underneath in the stack, and the
    // connected-wallet (Phantom/MWA) path the backend never sees.
    useEffect(() => onBalanceChanged(load), [load]);

    // Backend-confirmed custodial Send/Swap — also covers another device with
    // the app open syncing the moment this device's transaction confirms.
    useEffect(() => {
        const s = getSocket();
        const handler = () => load();
        s?.on("wallet:balance_changed", handler);
        return () => { s?.off("wallet:balance_changed", handler); };
    }, [load]);

    const onReceive = () => navigation.navigate("Wallet-recv");
    const onSend = () => navigation.navigate("Wallet-send");
    const onSwap = () => navigation.navigate("Wallet-swap");
    const onBuy = () => navigation.navigate("Wallet-buy");
    const onTxHistory = () => navigation.navigate("Wallet-history");
    const onSettings = () => navigation.navigate("Wallet-settings");
    const openChart = (token: any) => navigation.navigate("Wallet-chart", { token });

    return {
        username,
        balance,
        onReceive,
        onSend,
        onSwap,
        onBuy,
        onTxHistory,
        onSettings,
        openChart,
        reload: load,
    };
}
