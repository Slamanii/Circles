import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";

type Member = {
    user_id: string;
    role: "admin" | "member";
    muted: boolean;
    users?: { username: string; avatar: string };
};

type Props = {
    members: Member[];
    currentUserId: string;
    onRemove: (userId: string) => void;
    onMakeAdmin: (userId: string) => void;
};

export function MemberList({ members, currentUserId, onRemove, onMakeAdmin }: Props) {
    const C = getColors(useAppTheme().theme);
    const isAdmin = members.find(m => m.user_id === currentUserId)?.role === "admin";

    return (
        <FlatList
            data={members}
            keyExtractor={item => item.user_id}
            scrollEnabled={false}
            renderItem={({ item }) => (
                <View style={[styles.row, { borderBottomColor: C.border }]}>
                    <Image source={{ uri: item.users?.avatar }} style={[styles.avatar, { backgroundColor: C.surface }]} />
                    <View style={styles.info}>
                        <Text style={[styles.name, { color: C.text }]}>{item.users?.username ?? "Unknown"}</Text>
                        <View style={styles.badges}>
                            {item.role === "admin" && <Text style={[styles.badge, { color: C.accent }]}>Admin</Text>}
                            {item.muted          && <Text style={[styles.badge, { color: C.textMuted }]}>Muted</Text>}
                        </View>
                    </View>
                    {isAdmin && item.user_id !== currentUserId && (
                        <View style={styles.actions}>
                            {item.role !== "admin" && (
                                <TouchableOpacity
                                    style={[styles.btn, { backgroundColor: C.surface }]}
                                    onPress={() => onMakeAdmin(item.user_id)}
                                >
                                    <Text style={[styles.btnText, { color: C.textSecondary }]}>Make Admin</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={[styles.btn, styles.removeBtn]} onPress={() => onRemove(item.user_id)}>
                                <Text style={styles.removeText}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        />
    );
}

const styles = StyleSheet.create({
    row:        { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
    avatar:     { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    info:       { flex: 1 },
    name:       { fontSize: 15, fontWeight: "500" },
    badges:     { flexDirection: "row", gap: 8, marginTop: 2 },
    badge:      { fontSize: 11 },
    actions:    { flexDirection: "row", gap: 8 },
    btn:        { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
    btnText:    { fontSize: 12 },
    removeBtn:  { backgroundColor: "#3B1A1A" },
    removeText: { fontSize: 12, color: "#F87171" },
});
