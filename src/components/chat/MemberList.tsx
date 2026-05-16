import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

    const isAdmin = members.find(m => m.user_id === currentUserId)?.role === "admin";

    return (
        <FlatList
            data={members}
            keyExtractor={(item) => item.user_id}
            scrollEnabled={false}
            renderItem={({ item }) => (
                <View style={styles.row}>
                    <Image
                        source={{ uri: item.users?.avatar }}
                        style={styles.avatar}
                    />
                    <View style={styles.info}>
                        <Text style={styles.name}>{item.users?.username ?? "Unknown"}</Text>
                        {item.role === "admin" && (
                            <Text style={styles.badge}>Admin</Text>
                        )}
                    </View>
                    {isAdmin && item.user_id !== currentUserId && (
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.btn}
                                onPress={() => onMakeAdmin(item.user_id)}
                            >
                                <Text style={styles.btnText}>Make Admin</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btn, styles.removeBtn]}
                                onPress={() => onRemove(item.user_id)}
                            >
                                <Text style={[styles.btnText, styles.removeText]}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        />
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderColor: "#1E293B",
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: "#1E293B",
    },
    info: { flex: 1 },
    name: { color: "#F1F5F9", fontSize: 15, fontWeight: "500" },
    badge: { fontSize: 11, color: "#60A5FA", marginTop: 2 },
    actions: { flexDirection: "row", gap: 8 },
    btn: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
        backgroundColor: "#1E293B",
    },
    btnText: { fontSize: 12, color: "#94A3B8" },
    removeBtn: { backgroundColor: "#3B1A1A" },
    removeText: { color: "#F87171" },
});
