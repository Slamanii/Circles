import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Event } from "../hooks/useEvents";
import { useCountdown } from "../hooks/useCountdown";

type Props = {
    event: Event;
    liked: boolean;
    saved: boolean;
    onLike: () => void;
    onPreSave: () => void;
    onGetTicket: () => void;
};

export default function EventCard({ event, liked, saved, onLike, onPreSave, onGetTicket }: Props) {
    const { display, expired } = useCountdown(event.event_date);

    return (
        <TouchableOpacity style={styles.card} activeOpacity={0.85}>

            {/* Flyer placeholder */}
            <View style={styles.flyer}>
                <Text style={styles.flyerText}>{event.title[0]}</Text>
            </View>

            <View style={styles.body}>
                <Text style={styles.title}>{event.title}</Text>
                <Text style={styles.venue}>{event.venue}</Text>
                <Text style={styles.description} numberOfLines={2}>{event.description}</Text>
                <Text style={styles.price}>₦{event.ticket_price.toLocaleString()}</Text>

                {/* Countdown line */}
                <View style={[styles.countdownRow, expired && styles.countdownExpired]}>
                    <Text style={styles.countdownLabel}>{expired ? "Event ended" : "Starts in"}</Text>
                    {!expired && <Text style={styles.countdownValue}>{display}</Text>}
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        onPress={onLike}
                        style={[styles.actionBtn, liked && styles.actionBtnActive]}
                    >
                        <Text style={[styles.actionText, liked && styles.actionTextActive]}>
                            {liked ? "Liked" : "Like"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onPreSave}
                        style={[styles.actionBtn, saved && styles.actionBtnActive]}
                    >
                        <Text style={[styles.actionText, saved && styles.actionTextActive]}>
                            {saved ? "Saved" : "Pre-save"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onGetTicket}
                        disabled={expired}
                        style={[styles.ticketBtn, expired && styles.ticketBtnDisabled]}
                    >
                        <Text style={styles.ticketText}>
                            {expired ? "Sold out" : "Get Ticket"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#1E293B",
        borderRadius: 14,
        marginHorizontal: 16,
        marginBottom: 16,
        overflow: "hidden",
    },
    flyer: {
        height: 140,
        backgroundColor: "#0F172A",
        justifyContent: "center",
        alignItems: "center",
    },
    flyerText: {
        color: "#3B82F6",
        fontSize: 48,
        fontWeight: "bold",
    },
    body: {
        padding: 14,
    },
    title: {
        color: "white",
        fontSize: 17,
        fontWeight: "700",
        marginBottom: 2,
    },
    venue: {
        color: "#64748B",
        fontSize: 12,
        marginBottom: 6,
    },
    description: {
        color: "#94A3B8",
        fontSize: 13,
        marginBottom: 8,
    },
    price: {
        color: "#60A5FA",
        fontWeight: "600",
        marginBottom: 10,
    },
    countdownRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#0F172A",
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginBottom: 12,
        gap: 8,
    },
    countdownExpired: {
        backgroundColor: "#1f0a0a",
    },
    countdownLabel: {
        color: "#64748B",
        fontSize: 11,
    },
    countdownValue: {
        color: "#F1F5F9",
        fontSize: 12,
        fontWeight: "600",
        fontVariant: ["tabular-nums"],
    },
    actions: {
        flexDirection: "row",
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#334155",
        alignItems: "center",
    },
    actionBtnActive: {
        backgroundColor: "#1D4ED8",
    },
    actionText: {
        color: "#94A3B8",
        fontSize: 12,
        fontWeight: "600",
    },
    actionTextActive: {
        color: "white",
    },
    ticketBtn: {
        flex: 1.4,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#3B82F6",
        alignItems: "center",
    },
    ticketBtnDisabled: {
        backgroundColor: "#334155",
    },
    ticketText: {
        color: "white",
        fontSize: 12,
        fontWeight: "700",
    },
});
