import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";
import { fetchFollowers, fetchFollowing, followUser, unfollowUser, FollowRow } from "../../services/user";
import { AppNotification } from "../../services/notifications";
import { getSocket } from "../../services/socket";

type Mode = "followers" | "following";
const PAGE_SIZE = 30;

export default function FollowListScreen({ route }: any) {
    const { userId, mode, username } = route.params as { userId: string; mode: Mode; username?: string };
    const navigation = useNavigation<any>();
    const C = getColors(useAppTheme().theme);

    const [items, setItems] = useState<FollowRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const idKey = mode === "followers" ? "follower_id" : "following_id";

    const fetchPage = mode === "followers" ? fetchFollowers : fetchFollowing;

    const load = useCallback(async () => {
        try {
            const data = await fetchPage(userId, PAGE_SIZE, 0);
            setItems(data ?? []);
            setHasMore((data ?? []).length === PAGE_SIZE);
        } catch (err) {
            console.error("FollowList load error", err);
        }
    }, [userId, mode]);

    useEffect(() => {
        AsyncStorage.getItem("user")
            .then((s) => setCurrentUserId(s ? JSON.parse(s).id : null))
            .catch(() => {});
        load().finally(() => setLoading(false));
    }, [load]);

    useEffect(() => {
        const s = getSocket();
        const handler = (n: AppNotification) => {
            if (n.type === "follow_new" && mode === "followers" && userId === currentUserId) load();
        };
        s?.on("notification", handler);
        return () => { s?.off("notification", handler); };
    }, [mode, userId, currentUserId, load]);

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const onLoadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const data = await fetchPage(userId, PAGE_SIZE, items.length);
            setItems((prev) => [...prev, ...(data ?? [])]);
            setHasMore((data ?? []).length === PAGE_SIZE);
        } catch (err) {
            console.error("FollowList load more error", err);
        } finally {
            setLoadingMore(false);
        }
    };

    const toggleFollow = async (row: FollowRow) => {
        const target = row.users;
        if (!target?.id) return;
        const wasFollowing = !!row.isFollowing;
        setItems((prev) => prev.map((r) => (r[idKey] === row[idKey] ? { ...r, isFollowing: !wasFollowing } : r)));
        try {
            if (wasFollowing) await unfollowUser(target.id);
            else await followUser(target.id);
        } catch (err) {
            console.error("toggleFollow failed", err);
            setItems((prev) => prev.map((r) => (r[idKey] === row[idKey] ? { ...r, isFollowing: wasFollowing } : r)));
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: C.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: C.text }]}>
                    {mode === "followers" ? "Followers" : "Following"}
                    {username ? ` · ${username}` : ""}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={items}
                keyExtractor={(item) => item[idKey] ?? ""}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.textSecondary} />
                }
                contentContainerStyle={styles.list}
                onEndReached={onLoadMore}
                onEndReachedThreshold={0.4}
                ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={C.textSecondary} /> : null}
                renderItem={({ item }) => {
                    const u = item.users;
                    const isSelf = u?.id === currentUserId;
                    return (
                        <TouchableOpacity
                            style={styles.row}
                            onPress={() => navigation.navigate("UserProfile", { followingId: u?.id })}
                        >
                            {u?.avatar ? (
                                <Image source={{ uri: u.avatar }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: C.surface }]}>
                                    <Ionicons name="person" size={22} color={C.textSecondary} />
                                </View>
                            )}
                            <Text style={[styles.username, { color: C.text }]} numberOfLines={1}>
                                {u?.username}
                            </Text>
                            {!isSelf && (
                                <TouchableOpacity
                                    style={[
                                        styles.followBtn,
                                        { borderColor: C.text },
                                        item.isFollowing && { backgroundColor: C.text },
                                    ]}
                                    onPress={() => toggleFollow(item)}
                                >
                                    <Text style={[
                                        styles.followBtnText,
                                        { color: item.isFollowing ? C.background : C.text },
                                    ]}>
                                        {item.isFollowing ? "Following" : "Follow"}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.empty}>
                            <Text style={{ color: C.textMuted }}>
                                {mode === "followers" ? "No followers yet" : "Not following anyone yet"}
                            </Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 56 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    headerTitle: { fontSize: 17, fontWeight: "700" },
    list: { paddingHorizontal: 16, paddingBottom: 32 },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        gap: 12,
    },
    avatar: { width: 46, height: 46, borderRadius: 23 },
    avatarFallback: { alignItems: "center", justifyContent: "center" },
    username: { flex: 1, fontSize: 15, fontWeight: "600" },
    followBtn: {
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 16,
    },
    followBtnText: { fontSize: 13, fontWeight: "600" },
    empty: { alignItems: "center", paddingTop: 60 },
});
