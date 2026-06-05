import { View, Text, TouchableOpacity, Image } from "react-native"
import { useAppTheme } from "../../context/ThemeContext"
import { getColors } from "../../shared/theme"

export function ChatPreviewItem({
    groupName,
    lastMessage,
    time,
    image,
    pinned,
    muted,
    onPress,
    onLongPress,
}: any) {
    const { theme } = useAppTheme();
    const C = getColors(theme);

    return (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderBottomWidth: 0.5,
                borderBottomColor: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)",
            }}
        >
            <Image
                source={image}
                style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    marginRight: 12,
                }}
            />

            <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "bold", fontSize: 16, color: C.text }}>
                    {groupName}
                </Text>

                <Text
                    numberOfLines={1}
                    style={{
                        color: muted ? C.textMuted : C.textSecondary,
                        marginTop: 2,
                    }}
                >
                    {muted ? "🔇 " : ""}
                    {lastMessage}
                </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: C.textSecondary, fontSize: 12 }}>
                    {time}
                </Text>

                {pinned && (
                    <Text style={{ marginTop: 4 }}>
                        📌
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
}