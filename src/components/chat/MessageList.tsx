import { FlatList, Text, View } from "react-native"
import { MessageBubble } from "./MessageBubble"
import { useAppTheme } from "../../context/ThemeContext"
import { getColors } from "../../shared/theme"

type Props = {
    messages: any[];
    onDelete: (id: string) => void;
    onShare:  (id: string) => void;
    onPin:    (id: string) => void;
    onReply:  (id: string) => void;
    onStar:   (id: string) => void;
    onSelect: (id: string) => void;
    onVotePoll: (id: string, optionIds: string[]) => void;
    currentUserId: string | null;
    selectionMode: boolean;
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
};

export function MessageList({
    messages, onDelete, onShare, onPin, onReply, onStar, onSelect, onVotePoll, currentUserId,
    selectionMode, selectedIds, onToggleSelect,
}: Props) {
    const C = getColors(useAppTheme().theme);

    const renderItem = ({ item, index }: any) => {
        const prev = messages[index - 1];
        const showDate = !prev || prev.date !== item.date;

        return (
            <View>
                {showDate && (
                    <Text style={{ alignSelf: "center", marginVertical: 10, color: C.textSecondary }}>
                        {item.date}
                    </Text>
                )}
                <MessageBubble
                    message={item}
                    onDelete={() => onDelete(item.id)}
                    onShare={() => onShare(item.id)}
                    onPin={() => onPin(item.id)}
                    onReply={() => onReply(item.id)}
                    onStar={() => onStar(item.id)}
                    onSelect={() => onSelect(item.id)}
                    onVotePoll={optionIds => onVotePoll(item.id, optionIds)}
                    currentUserId={currentUserId}
                    selectionMode={selectionMode}
                    selected={selectedIds.has(item.id)}
                    onToggleSelect={() => onToggleSelect(item.id)}
                />
            </View>
        );
    };

    return (
        <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 8 }}
        />
    );
}
