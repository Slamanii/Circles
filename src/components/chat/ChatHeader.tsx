import { View, Text, TouchableOpacity, Image } from "react-native"

export function ChatHeader({
    groupName,
    groupImage,
    onBack,
    onOpenControl
}: any) {
    return (
        <View style={{
            flexDirection: "row",
            alignItems: "center",
            paddingTop: 50,
            paddingHorizontal: 16,
            paddingBottom: 12,
            borderBottomWidth: 0.5,
            borderBottomColor: "#ddd",
            backgroundColor: "white", 
        }}
        >
            <TouchableOpacity onPress={onBack}>
                <Text style={{ fontSize: 18 }}>🔙</Text>
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

                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                    {groupName}
                </Text>
            </TouchableOpacity>

        </View>
    );
}