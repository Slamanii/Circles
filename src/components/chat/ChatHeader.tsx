import { Image, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";

export function ChatHeader({
    groupName,
    groupImage,
    onBack,
    onOpenControl
}: any) {
    const C = getColors(useAppTheme().theme);

    return (
        <View style={{
            flexDirection: "row",
            alignItems: "center",
            paddingTop: 50,
            paddingHorizontal: 16,
            paddingBottom: 12,
            borderBottomWidth: 0.5,
            borderBottomColor: "#ddd",
            backgroundColor: C.headerBg,
        }}
        >
            <TouchableOpacity onPress={onBack}>
                <Text style={{ fontSize: 18, color: C.text }}>🔙</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={onOpenControl}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: 12,
                  flex: 1,
                }}
            >
                <Image
                    source={groupImage}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        marginRight: 10,
                    }}
                />

                <Text style={{ fontSize: 16, fontWeight: "bold", color: C.text }}>
                    {groupName}
                </Text>
            </TouchableOpacity>

        </View>
    );
}