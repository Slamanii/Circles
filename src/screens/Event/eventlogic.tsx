import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Alert, Linking } from "react-native";
import { TOKENS } from "../../../shared/constants";
import { useEvents } from "../../hooks/useEvents";
import { useMobileWallet } from "../../hooks/useMobileWallet";
import { useStepUp } from "../../hooks/useStepUp";
import { ActiveWallet, CUSTODIAL, getActiveWallet } from "../../hooks/useWalletConnection";
import { LikeEvent, PreSave } from "../../services/eventService";
import { makeCustodialSigner } from "../../services/wallet/custodialSign";
import { sendSol, sendSplToken } from "../../services/wallet/send";
import { confirmWalletPurchase, getPaymentOptions, initiatePaystackPay } from "../../services/walletService";

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
    const { requestStepUp, promptProps } = useStepUp();
    const { events, loading, error, reload } = useEvents();

    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

    // Same source as walletscreen.tsx's gate — this hook has no route params,
    // so it reads the user's active-wallet choice directly.
    const [activeWallet, setActiveWalletState] = useState<ActiveWallet | null>(null);
    const [storedAddress, setStoredAddress] = useState("");

    useEffect(() => {
        getActiveWallet().then(setActiveWalletState).catch(() => {});
        AsyncStorage.getItem("user")
            .then(raw => { if (raw) setStoredAddress(JSON.parse(raw).address ?? ""); })
            .catch(() => {});
    }, []);

    const isCustodial = activeWallet === CUSTODIAL;
    const canPay = isCustodial || !!wallet.account;
    const effectiveAddress = isCustodial ? storedAddress : ((wallet.account as any)?.address?.toBase58?.() ?? "");

    // Token picker state
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerLoading, setPickerLoading] = useState(false);
    const [tokenOptions, setTokenOptions] = useState<TokenOption[]>([]);
    const [pendingPayment, setPendingPayment] = useState<{ eventId: string; tierId: string; quantity: number } | null>(null);

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

    const handlePaystackPayment = async (eventId: string, tierId: string, quantity: number) => {
        try {
            const result = await initiatePaystackPay(eventId, tierId, quantity);
            if (result?.checkoutUrl) {
                await Linking.openURL(result.checkoutUrl);
            }
        } catch (err) {
            Alert.alert("Payment failed", err instanceof Error ? err.message : "Please try again");
        }
    };

    const handleWalletPayment = async (eventId: string, tierId: string, quantity: number) => {
        if (!canPay) {
            Alert.alert("Connect your wallet first");
            return;
        }
        setPendingPayment({ eventId, tierId, quantity });
        setPickerVisible(true);
        setPickerLoading(true);
        try {
            const data = await getPaymentOptions(eventId, tierId, quantity);
            // Backend reserves tickets at quote time — if fewer were available than
            // requested, it quotes for however many it could actually reserve.
            // The adjusted quantity (not the original request) drives everything
            // downstream: the payment amount and the confirm call both use it.
            if (data.adjusted) {
                setPickerVisible(false);
                Alert.alert(
                    "Fewer tickets available",
                    `Only ${data.quantity} ticket${data.quantity > 1 ? "s" : ""} left. Continue with ${data.quantity}?`,
                    [
                        { text: "Cancel", style: "cancel", onPress: () => setPendingPayment(null) },
                        {
                            text: "Continue", onPress: () => {
                                setPendingPayment({ eventId, tierId, quantity: data.quantity });
                                setTokenOptions(data.options);
                                setPickerVisible(true);
                            },
                        },
                    ],
                );
            } else {
                setPendingPayment({ eventId, tierId, quantity: data.quantity });
                setTokenOptions(data.options);
            }
        } catch (err) {
            setPickerVisible(false);
            Alert.alert("Failed to fetch prices", err instanceof Error ? err.message : "Please try again");
        } finally {
            setPickerLoading(false);
        }
    };

    const handleTokenSelect = async (option: TokenOption) => {
        if (!pendingPayment) return;
        setPickerVisible(false);

        const { eventId, tierId } = pendingPayment;
        const isNativeSol = option.mint === TOKENS.solana.mint;

        try {
            const signAndSend = isCustodial
                ? makeCustodialSigner(requestStepUp)
                : (tx: any) => (wallet as any).signAndSendTransaction(tx);
            const fromAddress = effectiveAddress;
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

            const result = await confirmWalletPurchase(eventId, tierId, txSig, option.mint);
            const claimed = result.ticketsClaimed;
            Alert.alert("Success", `${claimed} ticket${claimed > 1 ? "s" : ""} purchased!`);
        } catch (err) {
            Alert.alert("Payment failed", err instanceof Error ? err.message : "Please try again");
        } finally {
            setPendingPayment(null);
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
        canPayWithWallet: canPay,
        // Token picker
        pickerVisible,
        pickerLoading,
        tokenOptions,
        handleTokenSelect,
        closeTokenPicker: () => setPickerVisible(false),
        promptProps,
    };
}
