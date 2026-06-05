import { FlatList, View } from "react-native";
import { ChatListHeader } from "../../components/chat/ChatListHeader";
import { ChatPreviewItem } from "../../components/chat/ChatPreviewItem";
import { useChatListLogic } from "./chatcontrolpanelscreen";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";

export function ChatListScreen() {
    const C = getColors(useAppTheme().theme);
    const { username, groups, archiveFilter, onFilterChange, onToggleSelection, onGroupPress, onBack } = useChatListLogic();

    return (
        <View style={{ flex: 1, backgroundColor: C.background }}>
            <ChatListHeader
                username={username}
                archiveFilter={archiveFilter}
                onFilterChange={onFilterChange}
                onToggleSelection={onToggleSelection}
                onBack={onBack}
            />
            <FlatList
                data={groups}
                keyExtractor={(item) => item.groups?.id ?? item.groupId}
                renderItem={({ item }) => {
                    const group = item.groups ?? item;
                    const lastMsg = group.messages?.[0];
                    return (
                        <ChatPreviewItem
                            groupName={group.name ?? group.groupname ?? group.groupName}
                            lastMessage={lastMsg?.content ?? "No messages yet"}
                            time={lastMsg?.created_at ?? ""}
                            image={group.group_image ?? group.groupimage ?? null}
                            pinned={false}
                            muted={false}
                            onPress={() => onGroupPress(group)}
                            onLongPress={() => {}}
                        />
                    );
                }}
            />
        </View>
    );
}
