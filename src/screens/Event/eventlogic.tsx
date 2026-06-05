import { useState } from "react";
import { Alert, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMobileWallet } from "../../hooks/useMobileWallet";
import { LikeEvent, PreSave } from "../../services/eventService";
import { getPaymentOptions, confirmWalletPurchase, initiatePaystackPay } from "../../services/walletService";
import { sendSol, sendSplToken } from "../../services/wallet/send";
import { TOKENS } from "../../../shared/constants";
import { useEvents } from "../../hooks/useEvents";

const TREASURY = process.env.EXPO_PUBLIC_TREASURY_ADDRESS!;

type TokenOption = {
    key: string;
    symbol: string;
    mint: string;
    amount: number;
    rawAmount: number;
};

export function useEventLogic() {
    const navigation = useNavigation<any>();
    const wallet = useMobileWallet();
    const { events, loading, error, reload } = useEvents();

    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

    // Token picker state
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerLoading, setPickerLoading] = useState(false);
    const [tokenOptions, setTokenOptions] = useState<TokenOption[]>([]);
    const [pendingPayment, setPendingPayment] = useState<{ eventId: string; quantity: number } | null>(null);

    const handleLike = async (eventId: string) => {
        setLikedIds(prev => new Set(prev).add(eventId));
        try {
            await LikeEvent(eventId);
        } catch {
            setLikedIds(prev => { const next = new Set(prev); next.delete(eventId); return next; });
        }
    };

    const handlePreSave = async (eventId: string) => {
        setSavedIds(prev => new Set(prev).add(eventId));
        try {
            await PreSave(eventId);
        } catch {
            setSavedIds(prev => { const next = new Set(prev); next.delete(eventId); return next; });
        }
    };

    const handleGetTicket = (eventId: string) => {
        navigation.navigate("checkout", { eventId });
    };

    const handlePaystackPayment = async (eventId: string, quantity: number) => {
        try {
            const result = await initiatePaystackPay(eventId, quantity);
            if (result?.checkoutUrl) {
                await Linking.openURL(result.checkoutUrl);
            }
        } catch (err: any) {
            Alert.alert("Payment failed", err.message ?? "Please try again");
        }
    };

    const handleWalletPayment = async (eventId: string, quantity: number) => {
        if (!wallet.account) {
            Alert.alert("Connect your wallet first");
            return;
        }
        setPendingPayment({ eventId, quantity });
        setPickerVisible(true);
        setPickerLoading(true);
        try {
            const data = await getPaymentOptions(eventId, quantity);
            setTokenOptions(data.options);
        } catch (err: any) {
            setPickerVisible(false);
            Alert.alert("Failed to fetch prices", err.message ?? "Please try again");
        } finally {
            setPickerLoading(false);
        }
    };

    const handleTokenSelect = async (option: TokenOption) => {
        if (!pendingPayment) return;
        setPickerVisible(false);

        const { eventId, quantity } = pendingPayment;
        const isNativeSol = option.mint === TOKENS.solana.mint;

        try {
            const signAndSend = (tx: any) => (wallet as any).signAndSendTransaction(tx);
            const fromAddress = (wallet.account as any)?.address?.toBase58?.() ?? "";
            const tokenEntry = Object.values(TOKENS).find(t => t.mint === option.mint);
            const decimals = tokenEntry?.decimals ?? 9;

            const txSig = isNativeSol
                ? await sendSol({
                    fromAddress,
                    signAndSend,
                    destination: TREASURY,
                    amount: option.rawAmount / 1_000_000_000,
                })
                : await sendSplToken({
                    fromAddress,
                    signAndSend,
                    destination: TREASURY,
                    mint: option.mint,
                    amount: option.rawAmount / Math.pow(10, decimals),
                    decimals,
                });

            await confirmWalletPurchase(eventId, txSig, option.mint, quantity);
            Alert.alert("Success", `${quantity} ticket${quantity > 1 ? "s" : ""} purchased!`);
        } catch (err: any) {
            Alert.alert("Payment failed", err.message ?? "Please try again");
        }
    };

    return {
        events,
        loading,
        error,
        reload,
        likedIds,
        savedIds,
        handleLike,
        handlePreSave,
        handleGetTicket,
        handlePaystackPayment,
        handleWalletPayment,
        // Token picker
        pickerVisible,
        pickerLoading,
        tokenOptions,
        handleTokenSelect,
        closeTokenPicker: () => setPickerVisible(false),
    };
}
