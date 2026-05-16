import { View, Text, TouchableOpacity, Image } from "react-native"

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
                borderBottomColor: "#ddd"
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
                <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                    {groupName}
                </Text>

                <Text 
                    numberOfLines={1}
                    style={{
                        color: muted ? "gray" : "#444",
                        marginTop: 2,
                    }}
                    >
                    {muted ? "🔇 " : ""}
                    {lastMessage}
                </Text>
            </View>

            <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: "gray", fontSize: 12 }}>
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