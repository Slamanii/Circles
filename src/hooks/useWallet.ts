import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { fetchSolBalances } from "../services/wallet/balance";

export function useWalletLogic(walletAddress: string) {
    const navigation = useNavigation<any>();
    const [username, setUsername] = useState("");
    const [balance, setBalance] = useState<{ sol: number; tokens: any[]; totalUSD: number } | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const user = await AsyncStorage.getItem("user");
                if (user) setUsername(JSON.parse(user).username ?? "");

                if (walletAddress) {
                    const bal = await fetchSolBalances(walletAddress);
                    setBalance(bal);
                }
            } catch (err) {
                console.error("useWalletLogic load error:", err);
            }
        }
        load();
    }, [walletAddress]);

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
    };
}
