import { FlatList, Text, View } from "react-native"
import { MessageBubble } from "./MessageBubble"
import { useAppTheme } from "../../context/ThemeContext"
import { getColors } from "../../shared/theme"

type Props = {
    messages: any[];
    onDelete: (id: string) => void;
    onShare: (id: string) => void;
    onPin: (id: string) => void;
};

export function MessageList({ messages, onDelete, onShare, onPin }: Props) {
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