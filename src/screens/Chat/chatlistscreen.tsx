import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from "react-native";
import { ChatListHeader } from "../../components/chat/ChatListHeader";
import { ChatPreviewItem } from "../../components/chat/ChatPreviewItem";
import { useChatListLogic } from "./chatcontrolpanelscreen";
import { Colors } from "../../shared/theme";

function formatChatTime(iso: string) {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatListScreen() {
    const navigation = useNavigation<any>();
    const {
        groups, unreadCounts, refreshing, onRefresh,
        onGroupPress, onBack, onNotificationsPress,
    } = useChatListLogic();

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["rgba(45,27,69,0.55)", "#0D0D0D", "rgba(232,90,160,0.22)"]}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFill}
            />

            <ChatListHeader onBack={onBack} onNotificationsPress={onNotificationsPress} />

            <FlatList
                data={groups}
                keyExtractor={(item) => item.groups?.id ?? item.groupId}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                }
                renderItem={({ item }) => {
                    const group = item.groups ?? item;
                    const lastMsg = group.messages?.[0];
                    return (
                        <ChatPreviewItem
                            groupName={group.name ?? group.groupname ?? group.groupName}
                            lastMessage={lastMsg?.content ?? "No messages yet"}
                            time={formatChatTime(lastMsg?.created_at)}
                            image={group.group_image ?? group.groupimage ?? null}
                            pinned={false}
                            muted={false}
                            unreadCount={unreadCounts[group.id] ?? 0}
                            onPress={() => onGroupPress(group)}
                            onLongPress={() => {}}
                        />
                    );
                }}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate("CreateEvent")}
                activeOpacity={0.85}
            >
                <Ionicons name="add" size={28} color={Colors.black} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0D0D0D" },
    list: {
        paddingHorizontal: 16,
        paddingBottom: 100,
        gap: 12,
    },
    fab: {
        position: "absolute",
        right: 20,
        bottom: 28,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.accent,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 6,
    },
});
