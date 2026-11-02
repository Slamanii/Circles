import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

const CATEGORY_LABELS: Record<string, string> = {
    movie: "Movie",
    professional: "Professional",
    concert: "Concert",
    birthday: "Birthday",
    sports: "Sports",
    educational: "Educational",
    private: "Private",
    other: "Other",
};

export default function EventCard({ event, liked, saved, onLike, onPreSave, onGetTicket }: Props) {
    const C = getColors(useAppTheme().theme);
    const categoryLabel = event.category === "other" && event.custom_category
        ? event.custom_category
        : CATEGORY_LABELS[event.category];

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

                    {categoryLabel ? (
                        <View style={[styles.categoryBadge, { backgroundColor: C.accentText + "22" }]}>
                            <Text style={[styles.categoryBadgeText, { color: C.accentText }]}>{categoryLabel}</Text>
                        </View>
                    ) : null}

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
                    <View style={styles.flyerClip}>
                        {event.flyer_card?.[0] ? (
                            <Image source={{ uri: event.flyer_card[0] }} style={styles.flyer} />
                        ) : (
                            <View style={[styles.flyerPlaceholder, { backgroundColor: C.accentText + "18", borderColor: C.accentText + "50" }]}>
                                <Text style={[styles.flyerInitial, { color: C.accentText }]}>
                                    {event.title?.[0]?.toUpperCase() ?? "E"}
                                </Text>
                            </View>
                        )}
                        {event.status === "cancelled" && (
                            <View style={styles.cancelledRibbon}>
                                <Text style={styles.cancelledRibbonText}>CANCELLED</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            <View style={[styles.divider, { backgroundColor: C.border }]} />

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity onPress={onPreSave} style={styles.iconBtn}>
                    <Ionicons
                        name={saved ? "bookmark" : "bookmark-outline"}
                        size={21}
                        color={saved ? C.accentText : C.textSecondary}
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={onLike} style={styles.iconBtn}>
                    <Ionicons
                        name={liked ? "heart" : "heart-outline"}
                        size={21}
                        color={liked ? "#EF4444" : C.textSecondary}
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={onGetTicket} style={[styles.ticketBtn, { backgroundColor: Colors.accent }]}>
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
    categoryBadge: {
        alignSelf: "flex-start",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginTop: 4,
    },
    categoryBadgeText: {
        fontSize: 11,
        fontWeight: "700",
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
    flyerClip: {
        width: 90,
        height: 100,
        borderRadius: Radius.md,
        overflow: "hidden",
        position: "relative",
    },
    cancelledRibbon: {
        position: "absolute",
        top: 36,
        left: -25,
        width: 140,
        paddingVertical: 4,
        backgroundColor: "#D64545",
        alignItems: "center",
        justifyContent: "center",
        transform: [{ rotate: "-40deg" }],
    },
    cancelledRibbonText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.5,
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
        borderWidth: 1.5,
        justifyContent: "center",
        alignItems: "center",
    },
    flyerInitial: {
        fontSize: 32,
        fontWeight: "800",
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
        borderRadius: Radius.full,
        paddingVertical: 10,
        alignItems: "center",
        marginLeft: 6,
    },
    ticketText: {
        color: Colors.black,
        fontSize: 14,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
});
