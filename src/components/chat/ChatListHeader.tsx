import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ChatListHeaderProps } from "../../../shared/Types";

export function ChatListHeader({ onBack, onNotificationsPress }: ChatListHeaderProps) {
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.title}>Chat List</Text>

            <TouchableOpacity onPress={onNotificationsPress} style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={22} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 56,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },
    iconButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
});
