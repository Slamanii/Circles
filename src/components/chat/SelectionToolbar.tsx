import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";

type Props = {
    count: number;
    onCancel: () => void;
    onCopy: () => void;
    onForward: () => void;
    onDelete: () => void;
};

export function SelectionToolbar({ count, onCancel, onCopy, onForward, onDelete }: Props) {
    const C = getColors(useAppTheme().theme);

    return (
        <View style={[styles.row, { backgroundColor: C.headerBg, borderBottomColor: C.border }]}>
            <TouchableOpacity onPress={onCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={C.text} />
            </TouchableOpacity>

            <Text style={[styles.count, { color: C.text }]}>{count}</Text>

            <View style={styles.actions}>
                <TouchableOpacity onPress={onCopy} style={styles.actionBtn}>
                    <Ionicons name="copy-outline" size={22} color={C.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onForward} style={styles.actionBtn}>
                    <Ionicons name="arrow-redo-outline" size={22} color={C.text} />
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
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 0.5,
        gap: 16,
    },
    count: { fontSize: 17, fontWeight: "700", flex: 1 },
    actions: { flexDirection: "row", gap: 20 },
    actionBtn: { padding: 2 },
});
