import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import {
    AppNotification,
    fetchNotifications,
    markAllNotificationsRead,
} from "../../services/notifications";
import { Colors, getColors, Radius, TAB_PAD } from "../../shared/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function typeIcon(type: AppNotification["type"]): IconName {
    switch (type) {
        case "mention":     return "at-outline";
        case "event":       return "calendar-outline";
        case "collectible": return "ticket-outline";
        case "wallet":      return "card-outline";
        case "like":        return "heart-outline";
        case "follow":      return "person-add-outline";
        case "chat":
        default:            return "chatbubble-outline";
    }
}

function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7)  return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
}

type NotifItemProps = { item: AppNotification; C: ReturnType<typeof getColors> };

function NotifItem({ item, C }: NotifItemProps) {
    const body = item.body ?? item.message ?? "";
    return (
        <View style={[
            styles.item,
            { backgroundColor: item.is_read ? C.background : C.accentLight },
        ]}>
            <View style={[styles.iconWrap, { backgroundColor: C.surface }]}>
                <Ionicons name={typeIcon(item.type)} size={20} color={Colors.accent} />
            </View>
            <View style={styles.textWrap}>
                <View style={styles.titleRow}>
                    <Text style={[styles.title, { color: C.text }]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    {!item.is_read && <View style={styles.unreadDot} />}
                </View>
                {!!body && (
                    <Text style={[styles.body, { color: C.textSecondary }]} numberOfLines={2}>
                        {body}
                    </Text>
                )}
                <Text style={[styles.time, { color: C.textMuted }]}>
                    {relativeTime(item.created_at)}
                </Text>
            </View>
        </View>
    );
}

export default function NotificationsScreen() {
    const C = getColors(useAppTheme().theme);
    const navigation = useNavigation<any>();

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading]   = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError]       = useState<string | null>(null);

    const load = async () => {
        try {
            const data = await fetchNotifications();
            setNotifications(data);
            setError(null);
        } catch {
            setError("Could not load notifications");
        }
    };

    useEffect(() => {
        load().finally(() => setLoading(false));
        markAllNotificationsRead().catch(() => {});
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: C.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: C.background }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: C.text }]}>Notifications</Text>
                <View style={styles.backBtn} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={Colors.accent} />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={[styles.errorText, { color: C.textSecondary }]}>{error}</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={item => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Colors.accent}
                            colors={[Colors.accent]}
                        />
                    }
                    renderItem={({ item }) => <NotifItem item={item} C={C} />}
                    ItemSeparatorComponent={() => (
                        <View style={[styles.separator, { backgroundColor: C.border }]} />
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="notifications-off-outline" size={44} color={C.textMuted} />
                            <Text style={[styles.emptyText, { color: C.textMuted }]}>
                                No notifications yet
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 56,
        paddingBottom: 12,
        paddingHorizontal: 8,
    },
    backBtn: { width: 40, alignItems: "center" },
    headerTitle: { fontSize: 17, fontWeight: "600" },
    list: { paddingBottom: TAB_PAD },
    item: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: Radius.full,
        alignItems: "center",
        justifyContent: "center",
    },
    textWrap: { flex: 1, gap: 2 },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    title: { fontSize: 14, fontWeight: "600", flex: 1 },
    unreadDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: Colors.accent,
    },
    body: { fontSize: 13, lineHeight: 18 },
    time: { fontSize: 12, marginTop: 2 },
    separator: { height: StyleSheet.hairlineWidth, marginLeft: 68 },
    errorText: { fontSize: 14 },
    empty: { alignItems: "center", paddingTop: 80, gap: 12 },
    emptyText: { fontSize: 15 },
});
