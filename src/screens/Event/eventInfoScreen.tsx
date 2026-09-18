import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors, ThemeColors } from "../../shared/theme";
import { fetchEventStats } from "../../services/user";
import { AppNotification } from "../../services/notifications";
import { getSocket } from "../../services/socket";
import { EventStats } from "../../../shared/Types";

export default function EventInfoScreen({ route }: any) {
    const { eventId, flyerCard } = route.params as { eventId: string; flyerCard?: string };
    const navigation = useNavigation<any>();
    const C = getColors(useAppTheme().theme);

    const [stats, setStats] = useState<EventStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setStats(await fetchEventStats(eventId));
            setError(null);
        } catch (err: any) {
            setError(err?.message ?? "Failed to load stats");
        }
    }, [eventId]);

    useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    // Organizer stats change from other users' actions (likes, mint completing)
    // — refresh live instead of only on manual pull-to-refresh.
    useEffect(() => {
        const s = getSocket();
        const handler = (n: AppNotification) => {
            if (
                (n.type === "event_liked" || n.type === "event_mint_complete" || n.type === "event_mint_failed") &&
                (n.reference_id === eventId || n.metadata?.eventId === eventId)
            ) {
                load();
            }
        };
        s?.on("notification", handler);
        return () => { s?.off("notification", handler); };
    }, [eventId, load]);

    return (
        <View style={[styles.container, { backgroundColor: C.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: C.text }]}>Event Info</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={C.textSecondary} />
            ) : error || !stats ? (
                <Text style={[styles.error, { color: C.textMuted }]}>{error ?? "Failed to load stats"}</Text>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.body}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.textSecondary} />
                    }
                >
                    {flyerCard ? <Image source={{ uri: flyerCard }} style={styles.flyer} /> : null}
                    <Text style={[styles.title, { color: C.text }]}>{stats.title}</Text>

                    <View style={styles.statsGrid}>
                        <StatCard C={C} icon="heart" label="Total Likes" value={stats.totalLikes} />
                        <StatCard C={C} icon="ticket" label="Tickets Sold" value={`${stats.sold} / ${stats.ticketSupply}`} />
                        <StatCard C={C} icon="cube" label="Tickets Minted" value={`${stats.minted} / ${stats.ticketSupply}`} />
                        <StatCard C={C} icon="cash" label="Revenue" value={stats.revenue} />
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function StatCard({ C, icon, label, value }: { C: ThemeColors; icon: IconName; label: string; value: string | number }) {
    return (
        <View style={[statStyles.card, { backgroundColor: C.surface }]}>
            <Ionicons name={icon} size={20} color="#E8622A" />
            <Text style={[statStyles.value, { color: C.text }]}>{value}</Text>
            <Text style={[statStyles.label, { color: C.textSecondary }]}>{label}</Text>
        </View>
    );
}

const statStyles = StyleSheet.create({
    card: {
        width: "47%",
        borderRadius: 14,
        padding: 16,
        gap: 6,
        alignItems: "flex-start",
    },
    value: { fontSize: 20, fontWeight: "700" },
    label: { fontSize: 12 },
});

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 56 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    headerTitle: { fontSize: 17, fontWeight: "700" },
    body: { paddingHorizontal: 16, gap: 16 },
    flyer: { width: "100%", aspectRatio: 16 / 9, borderRadius: 14 },
    title: { fontSize: 20, fontWeight: "700" },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 12,
    },
    error: { textAlign: "center", marginTop: 40 },
});
