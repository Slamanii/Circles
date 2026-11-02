import { View, Text, TouchableOpacity } from "react-native"
import { Image } from "expo-image"
import { Colors } from "../../shared/theme"

export function ChatPreviewItem({
    groupName,
    lastMessage,
    time,
    image,
    pinned,
    muted,
    unreadCount,
    onPress,
    onLongPress,
}: any) {
    return (
        <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: 20,
                paddingVertical: 12,
                paddingHorizontal: 14,
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
                <Text style={{ fontWeight: "700", fontSize: 15, color: "#fff" }} numberOfLines={1}>
                    {groupName}
                </Text>

                <Text
                    numberOfLines={1}
                    style={{
                        color: muted ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.6)",
                        fontSize: 13,
                        marginTop: 3,
                    }}
                >
                    {muted ? "🔇 " : ""}
                    {lastMessage}
                </Text>
            </View>

            <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                    {time}
                </Text>

                {pinned && (
                    <Text style={{ marginTop: 4 }}>
                        📌
                    </Text>
                )}

                {unreadCount > 0 && (
                    <View
                        style={{
                            marginTop: 4,
                            minWidth: 20,
                            height: 20,
                            borderRadius: 10,
                            paddingHorizontal: 6,
                            backgroundColor: Colors.accent,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Text style={{ color: Colors.black, fontSize: 12, fontWeight: "700" }}>
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}
