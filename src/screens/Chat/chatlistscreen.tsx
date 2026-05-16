import { FlatList, View } from "react-native";
import { ChatListHeader } from "../../components/chat/ChatListHeader";
import { ChatPreviewItem } from "../../components/chat/ChatPreviewItem";
import { useChatListLogic } from "./chatcontrolpanelscreen";

export function ChatListScreen() {

    const { username, groups, archiveFilter, onFilterChange, onToggleSelection, onGroupPress } = useChatListLogic();

    return (
        <View style={{ flex: 1 }}>
            <ChatListHeader
                username={username}
                archiveFilter={archiveFilter}
                onFilterChange={onFilterChange}
                onToggleSelection={onToggleSelection}
            />
            <FlatList
                data={groups}
                keyExtractor={(item) => item.groups?.id ?? item.groupId}
                renderItem={({ item }) => {
                    const group = item.groups ?? item;
                    const lastMsg = group.messages?.[0];
                    return (
                        <ChatPreviewItem
                            groupName={group.name ?? group.groupName}
                            lastMessage={lastMsg?.content ?? "No messages yet"}
                            time={lastMsg?.created_at ?? ""}
                            image={group.groupImage ?? null}
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
