import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";
import { LinkList, extractLinks } from "../../components/chat/LinkList";
import { MediaGallery } from "../../components/chat/MediaGallery";
import { MemberList } from "../../components/chat/MemberList";
import { getGroup, makeAdmin, removeMember } from "../../services/chatService";

type Tab = "members" | "media" | "links";

export function ChatControlScreen({ route, navigation }: any) {
    const C = getColors(useAppTheme().theme);
    const { groupId } = route.params;
    const [group, setGroup] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>("members");
    const currentUserIdRef = useRef<string | null>(null);

    useEffect(() => {
        async function load() {
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
        }
        load();
    }, [groupId]);

    const handleRemove = async (userId: string) => {
        try {
            await removeMember(groupId, userId);
            setGroup((prev: any) => ({
                ...prev,
                group_members: prev.group_members.filter((m: any) => m.user_id !== userId),
            }));
        } catch (err) { console.error("Remove failed", err); }
    };

    const handleMakeAdmin = async (userId: string) => {
        if (!currentUserIdRef.current) return;
        try {
            await makeAdmin(groupId, userId, currentUserIdRef.current);
            setGroup((prev: any) => ({
                ...prev,
                group_members: prev.group_members.map((m: any) =>
                    m.user_id === userId ? { ...m, role: "admin" } : m
                ),
            }));
        } catch (err) { console.error("Make admin failed", err); }
    };

    if (loading) return <ActivityIndicator style={{ flex: 1 }} color={C.accent} />;
    if (!group) return <Text style={[styles.error, { color: C.textSecondary }]}>Group not found</Text>;

    const members  = group.group_members ?? [];
    const messages = group.messages ?? [];

    const mediaItems = messages
        .filter((m: any) => m.type === "image" || m.type === "video")
        .map((m: any) => ({ id: m.id, type: m.type, uri: m.content, thumbnail: m.media?.thumbnail }));

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
                        onPress={(item: any) => navigation.navigate("MediaViewer", { uri: item.uri, type: item.type })}
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
    groupName:  { fontSize: 18, fontWeight: "600" },
    tabs:       { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
    tab:        { flex: 1, paddingVertical: 14, alignItems: "center" },
    tabText:    { fontSize: 14 },
    content:    { flex: 1, paddingHorizontal: 16 },
    error:      { textAlign: "center", marginTop: 40 },
});
