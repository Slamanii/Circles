import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import PaymentTerminal from "../../components/EventPurchaseTerminal";
import { TokenPicker } from "../../components/TokenPicker";
import EventCard from "../../components/EventCard";
import EventHeader from "./eventheader";
import { useEventLogic } from "./eventlogic";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";

function useCountdown(eventDate: string | null) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

    useEffect(() => {
        if (!eventDate) return;

        function tick() {
            const diff = new Date(eventDate!).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
                return;
            }
            setTimeLeft({
                days:    Math.floor(diff / 86_400_000),
                hours:   Math.floor((diff % 86_400_000) / 3_600_000),
                minutes: Math.floor((diff % 3_600_000)  / 60_000),
                seconds: Math.floor((diff % 60_000)     / 1_000),
                expired: false,
            });
        }

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [eventDate]);

    return timeLeft;
}

function CountdownUnit({ value, label, C }: { value: number; label: string; C: any }) {
    return (
        <View style={styles.unit}>
            <Text style={[styles.unitValue, { color: C.text }]}>
                {String(value).padStart(2, "0")}
            </Text>
            <Text style={[styles.unitLabel, { color: C.textSecondary }]}>{label}</Text>
        </View>
    );
}

export default function EventPurchaseScreen({ route }: any) {
    const { eventId } = route.params;
    const C = getColors(useAppTheme().theme);

    const {
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
        pickerVisible,
        pickerLoading,
        tokenOptions,
        handleTokenSelect,
        closeTokenPicker,
    } = useEventLogic();

    if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
    if (error) return <Text style={{ color: "red", margin: 20 }}>{error}</Text>;

    const event = events.find(e => e.id === eventId);
    if (!event) return <Text style={{ margin: 20, color: C.text }}>Event not found</Text>;

    return (
        <>
            <ScrollView style={[styles.container, { backgroundColor: C.background }]}>
                <EventHeader showBack />

                <EventCard
                    event={event}
                    liked={likedIds.has(event.id)}
                    saved={savedIds.has(event.id)}
                    onLike={() => handleLike(event.id)}
                    onPreSave={() => handlePreSave(event.id)}
                    onGetTicket={() => handleGetTicket(event.id)}
                />

                <Countdown eventDate={event.event_date ?? null} />

                <View style={styles.paymentSection}>
                    <Text style={[styles.paymentTitle, { color: C.text }]}>Choose Payment Method</Text>
                    <PaymentTerminal
                        onPaystack={(qty: number) => handlePaystackPayment(event.id, qty)}
                        onWallet={(qty: number) => handleWalletPayment(event.id, qty)}
                    />
                </View>
            </ScrollView>

            <TokenPicker
                visible={pickerVisible}
                options={tokenOptions}
                loading={pickerLoading}
                onSelect={handleTokenSelect}
                onClose={closeTokenPicker}
            />
        </>
    );
}

function Countdown({ eventDate }: { eventDate: string | null }) {
    const C = getColors(useAppTheme().theme);
    const { days, hours, minutes, seconds, expired } = useCountdown(eventDate);

    if (!eventDate) return null;

    return (
        <View style={[styles.countdownCard, { backgroundColor: C.card }]}>
            <Text style={[styles.countdownHeading, { color: C.textSecondary }]}>
                {expired ? "Event has started" : "Event starts in"}
            </Text>
            {!expired && (
                <View style={styles.countdownRow}>
                    <CountdownUnit value={days}    label="Days"    C={C} />
                    <Text style={[styles.colon, { color: C.textSecondary }]}>:</Text>
                    <CountdownUnit value={hours}   label="Hours"   C={C} />
                    <Text style={[styles.colon, { color: C.textSecondary }]}>:</Text>
                    <CountdownUnit value={minutes} label="Mins"    C={C} />
                    <Text style={[styles.colon, { color: C.textSecondary }]}>:</Text>
                    <CountdownUnit value={seconds} label="Secs"    C={C} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    countdownCard: {
        marginHorizontal: 16,
        marginVertical: 12,
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    countdownHeading: {
        fontSize: 12,
        fontWeight: "600",
        textAlign: "center",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 14,
    },
    countdownRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    unit: {
        alignItems: "center",
        minWidth: 52,
    },
    unitValue: {
        fontSize: 36,
        fontWeight: "800",
        lineHeight: 40,
    },
    unitLabel: {
        fontSize: 11,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginTop: 2,
    },
    colon: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 14,
    },
    paymentSection: {
        marginTop: 4,
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    paymentTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 12,
    },
});
