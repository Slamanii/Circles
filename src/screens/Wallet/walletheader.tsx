import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type WalletHeaderProps = {
    username: string;
    onSettings: () => void;
    onTxHistory: () => void;
};

export function WalletHeader({ username, onSettings, onTxHistory }: WalletHeaderProps) {
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={onSettings} style={styles.iconBtn} hitSlop={8}>
                <Ionicons name="settings-outline" size={22} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.nameRow} activeOpacity={0.7}>
                <Text style={styles.username}>{username || "Wallet"}</Text>
                <Ionicons name="chevron-down" size={16} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity onPress={onTxHistory} style={styles.iconBtn} hitSlop={8}>
                <Ionicons name="menu-outline" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 16,
        backgroundColor: "#2E2D2D",
    },
    iconBtn: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    username: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "600",
        letterSpacing: 0.2,
    },
});
