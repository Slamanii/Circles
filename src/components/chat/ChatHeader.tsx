import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function ChatHeader({
    groupName,
    groupImage,
    onBack,
    onOpenControl,
}: any) {
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={onOpenControl} style={styles.identity}>
                <Image source={groupImage} style={styles.avatar} />
                <Text style={styles.name} numberOfLines={1}>{groupName}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onOpenControl} style={styles.iconButton}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 56,
        paddingHorizontal: 16,
        paddingBottom: 14,
        gap: 10,
    },
    identity: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: 10,
    },
    avatar: { width: 36, height: 36, borderRadius: 18 },
    name: { fontSize: 16, fontWeight: "700", color: "#fff", flex: 1 },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
});
