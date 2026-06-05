import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { Event } from "../hooks/useEvents";
import { Colors, Radius, getColors } from "../shared/theme";

type Props = {
    event: Event;
    liked: boolean;
    saved: boolean;
    onLike: () => void;
    onPreSave: () => void;
    onGetTicket: () => void;
};

export default function EventCard({ event, liked, saved, onLike, onPreSave, onGetTicket }: Props) {
    const C = getColors(useAppTheme().theme);

    const dateLabel = event.event_date
        ? new Date(event.event_date).toLocaleDateString("en-GB", {
              weekday: "short", month: "short", day: "numeric",
          })
        : "TBA";

    return (
        <View style={[styles.card, { backgroundColor: C.card }]}>

            <View style={styles.body}>
                {/* Left: info + price */}
                <View style={styles.info}>
                    <Text style={[styles.title, { color: C.text }]} numberOfLines={2}>
                        {event.title}
                    </Text>

                    <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={13} color={C.textSecondary} />
                        <Text style={[styles.metaText, { color: C.textSecondary }]}>{dateLabel}</Text>
                    </View>

                    <View style={styles.metaRow}>
                        <Ionicons name="location-outline" size={13} color={C.textSecondary} />
                        <Text style={[styles.metaText, { color: C.textSecondary }]} numberOfLines={1}>
                            {event.venue ?? "TBA"}
                        </Text>
                    </View>

                    <Text style={[styles.price, { color: C.text }]}>
                        ₦{Number(event.ticket_price ?? 0).toLocaleString()}
                    </Text>
                </View>

                {/* Right: flyer */}
                <View style={styles.flyerCol}>
                    {event.flyer_card ? (
                        <Image source={{ uri: event.flyer_card }} style={styles.flyer} />
                    ) : (
                        <View style={styles.flyerPlaceholder}>
                            <Text style={styles.flyerInitial}>
                                {event.title?.[0]?.toUpperCase() ?? "E"}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: C.border }]} />

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity onPress={onPreSave} style={styles.iconBtn}>
                    <Ionicons
                        name={saved ? "bookmark" : "bookmark-outline"}
                        size={21}
                        color={saved ? Colors.accent : C.textSecondary}
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={onLike} style={styles.iconBtn}>
                    <Ionicons
                        name={liked ? "heart" : "heart-outline"}
                        size={21}
                        color={liked ? "#EF4444" : C.textSecondary}
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={onGetTicket} style={styles.ticketBtn}>
                    <Text style={styles.ticketText}>Get Tickets</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Radius.xl,
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.11,
        shadowRadius: 18,
        elevation: 8,
    },
    body: {
        flexDirection: "row",
        padding: 16,
        gap: 14,
    },
    info: {
        flex: 1,
        gap: 7,
        justifyContent: "center",
    },
    title: {
        fontSize: 17,
        fontWeight: "800",
        lineHeight: 22,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    metaText: {
        fontSize: 12,
        flex: 1,
    },
    price: {
        fontSize: 15,
        fontWeight: "700",
        marginTop: 2,
    },
    flyerCol: {
        justifyContent: "center",
    },
    flyer: {
        width: 90,
        height: 100,
        borderRadius: Radius.md,
    },
    flyerPlaceholder: {
        width: 90,
        height: 100,
        borderRadius: Radius.md,
        backgroundColor: Colors.accent + "18",
        borderWidth: 1.5,
        borderColor: Colors.accent + "50",
        justifyContent: "center",
        alignItems: "center",
    },
    flyerInitial: {
        fontSize: 32,
        fontWeight: "800",
        color: Colors.accent,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginHorizontal: 16,
    },
    actions: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 11,
        gap: 10,
    },
    iconBtn: {
        padding: 4,
    },
    ticketBtn: {
        flex: 1,
        backgroundColor: Colors.accent,
        borderRadius: Radius.full,
        paddingVertical: 10,
        alignItems: "center",
        marginLeft: 6,
    },
    ticketText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
});
