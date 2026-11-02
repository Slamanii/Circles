import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
    count: number;
    onCancel: () => void;
    onCopy: () => void;
    onForward: () => void;
    onDelete: () => void;
};

export function SelectionToolbar({ count, onCancel, onCopy, onForward, onDelete }: Props) {
    return (
        <View style={styles.row}>
            <TouchableOpacity onPress={onCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.count}>{count}</Text>

            <View style={styles.actions}>
                <TouchableOpacity onPress={onCopy} style={styles.actionBtn}>
                    <Ionicons name="copy-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onForward} style={styles.actionBtn}>
                    <Ionicons name="arrow-redo-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 56,
        paddingHorizontal: 16,
        paddingBottom: 14,
        gap: 16,
    },
    count: { fontSize: 17, fontWeight: "700", flex: 1, color: "#fff" },
    actions: { flexDirection: "row", gap: 20 },
    actionBtn: { padding: 2 },
});
