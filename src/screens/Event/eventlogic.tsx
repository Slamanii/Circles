import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { LikeEvent, PreSave } from "../../services/eventService";
import { InitiateWalletTransaction, initiatePaystackPay } from "../../services/walletService";
import { useEvents } from "../../hooks/useEvents";

export function useEventLogic() {

    const navigation = useNavigation<any>();

    const { events, loading, error } = useEvents();
    const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

    const handleLike = async (eventId: string) => {
        setLikedIds(prev => new Set(prev).add(eventId));
        try {
            await LikeEvent(eventId);
        } catch {
            setLikedIds(prev => { const next = new Set(prev); next.delete(eventId); return next; });
        }
    }

    const handlePreSave = async (eventId: string) => {
        setSavedIds(prev => new Set(prev).add(eventId));
        try {
            await PreSave(eventId);
        } catch {
            setSavedIds(prev => { const next = new Set(prev); next.delete(eventId); return next; });
        }
    }

    const handleGetTicket = (eventId: string) => {
        navigation.navigate("checkout", { eventId });
    }

    const handlePaystackPayment = async (eventId: string) => {
        try {
            const result = await initiatePaystackPay(eventId);
            if (result?.authorization_url) {
                navigation.navigate("PaystackRedirect", { url: result.authorization_url });
            }
        } catch (err) {
            console.error("Paystack payment failed", err);
        }
    }

    const handleWalletPayment = async (eventId: string) => {
        try {
            await InitiateWalletTransaction(eventId);
        } catch (err) {
            console.error("Wallet payment failed", err);
        }
    }

    return {
        events,
        loading,
        error,
        likedIds,
        savedIds,
        handleLike,
        handlePreSave,
        handleGetTicket,
        handlePaystackPayment,
        handleWalletPayment,
    }
}
