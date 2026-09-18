import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, AlertButton, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";
import { LinkList, extractLinks } from "../../components/chat/LinkList";
import { MediaGallery } from "../../components/chat/MediaGallery";
import { MemberList } from "../../components/chat/MemberList";
import { deleteGroup, getGroup, leaveGroup, makeAdmin, removeMember } from "../../services/chatService";
import { AppNotification } from "../../services/notifications";
import { getSocket } from "../../services/socket";
import { RawGroup } from "../../../shared/Types";

type Tab = "members" | "media" | "links";

export function ChatControlScreen({ route, navigation }: any) {
    const C = getColors(useAppTheme().theme);
    const { groupId } = route.params;
    const [group, setGroup] = useState<RawGroup | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>("members");
    const currentUserIdRef = useRef<string | null>(null);

    const load = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (token) {
                const payload = JSON.parse(atob(token.split(".")[1]));
                currentUserIdRef.current = payload.userId;
            }
            const data = await getGroup(groupId);
            setGroup(data.group);
        } catch (err) {
            console.error("Failed to load group", err);
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    useEffect(() => { load(); }, [load]);

    // Live-refresh when another admin removes/promotes a member, someone
    // leaves, or the group is deleted — this screen previously only ever
    // reflected its own optimistic local patches, never anyone else's action.
    useEffect(() => {
        const s = getSocket();
        const handler = (n: AppNotification) => {
            if (n.metadata?.groupId !== groupId) return;
            switch (n.type) {
                case "chat_removed_from_group":
                    if (!n.metadata?.removedUserId) {
                        Alert.alert("Removed", "You were removed from this group.");
                        navigation.navigate("ChatListScreen");
                    } else {
                        load();
                    }
                    break;
                case "chat_group_deleted":
                    Alert.alert("Group deleted", "This group was deleted.");
                    navigation.navigate("ChatListScreen");
                    break;
                case "chat_made_admin":
                case "chat_member_left":
                    load();
                    break;
            }
        };
        s?.on("notification", handler);
        return () => { s?.off("notification", handler); };
    }, [groupId, load, navigation]);

    const handleRemove = async (userId: string) => {
        try {
            await removeMember(groupId, userId);
            setGroup((prev) => prev ? ({
                ...prev,
                group_members: (prev.group_members ?? []).filter((m) => m.user_id !== userId),
            }) : prev);
        } catch (err) { console.error("Remove failed", err); }
    };

    const handleMakeAdmin = async (userId: string) => {
        if (!currentUserIdRef.current) return;
        try {
            await makeAdmin(groupId, userId, currentUserIdRef.current);
            setGroup((prev) => prev ? ({
                ...prev,
                group_members: (prev.group_members ?? []).map((m) =>
                    m.user_id === userId ? { ...m, role: "admin" as const } : m
                ),
            }) : prev);
        } catch (err) { console.error("Make admin failed", err); }
    };

    const handleLeave = () => {
        Alert.alert("Leave Group", "Are you sure you want to leave this group?", [
            {
                text: "Leave",
                style: "destructive",
                onPress: async () => {
                    try {
                        await leaveGroup(groupId);
                        navigation.navigate("ChatListScreen");
                    } catch (err) {
                        console.error("Leave group failed", err);
                        Alert.alert("Failed to leave group");
                    }
                },
            },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    const handleDelete = () => {
        Alert.alert("Delete Group", "This will permanently delete the group for everyone. Continue?", [
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteGroup(groupId);
                        navigation.navigate("ChatListScreen");
                    } catch (err) {
                        console.error("Delete group failed", err);
                        Alert.alert("Failed to delete group");
                    }
                },
            },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    const openGroupMenu = () => {
        const options: AlertButton[] = [
            { text: "Leave Group", style: "destructive", onPress: handleLeave },
        ];
        if (isAdmin) {
            options.push({ text: "Delete Group", style: "destructive", onPress: handleDelete });
        }
        options.push({ text: "Cancel", style: "cancel" });
        Alert.alert("Group Options", "Choose an option", options);
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} color={C.accent} />;
    if (!group) return <Text style={[styles.error, { color: C.textSecondary }]}>Group not found</Text>;

    const members  = group.group_members ?? [];
    const messages = group.messages ?? [];
    const isAdmin  = members.some(
        (m) => m.user_id === currentUserIdRef.current && m.role === "admin"
    );

    const mediaItems = messages
        .filter((m) => m.type === "image" || m.type === "video")
        .map((m) => ({ id: m.id, type: m.type as "image" | "video", uri: m.content, thumbnail: m.media?.thumbnail }));

    const links = extractLinks(messages);

    const TABS: { key: Tab; label: string }[] = [
        { key: "members", label: `Members (${members.length})` },
        { key: "media",   label: "Media" },
        { key: "links",   label: "Links" },
    ];

    return (
        <View style={[styles.container, { backgroundColor: C.background }]}>
            <View style={[styles.header, { borderBottomColor: C.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={[styles.back, { color: C.text }]}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.groupName, { color: C.text }]}>{group.name}</Text>
                <TouchableOpacity onPress={openGroupMenu} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="ellipsis-horizontal" size={22} color={C.text} />
                </TouchableOpacity>
            </View>

            <View style={[styles.tabs, { borderBottomColor: C.border }]}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && { borderBottomColor: C.accent, borderBottomWidth: 2 }]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[styles.tabText, { color: activeTab === tab.key ? C.accent : C.textSecondary }]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                {activeTab === "members" && (
                    <MemberList
                        members={members}
                        currentUserId={currentUserIdRef.current ?? ""}
                        onRemove={handleRemove}
                        onMakeAdmin={handleMakeAdmin}
                    />
                )}
                {activeTab === "media" && (
                    <MediaGallery
                        items={mediaItems}
                        onPress={(item) => navigation.navigate("MediaViewer", { uri: item.uri, type: item.type })}
                    />
                )}
                {activeTab === "links" && <LinkList links={links} />}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container:  { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    back:       { fontSize: 22, marginRight: 16 },
    groupName:  { fontSize: 18, fontWeight: "600", flex: 1 },
    tabs:       { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
    tab:        { flex: 1, paddingVertical: 14, alignItems: "center" },
    tabText:    { fontSize: 14 },
    content:    { flex: 1, paddingHorizontal: 16 },
    error:      { textAlign: "center", marginTop: 40 },
});
