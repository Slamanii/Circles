import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
    ActivityIndicator, FlatList, Modal, StyleSheet, Text,
    TouchableOpacity, TouchableWithoutFeedback, View,
} from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";
import { fetchUserGroups } from "../../services/chatService";
import { UserGroupEntry } from "../../../shared/Types";

type Props = {
    visible: boolean;
    onClose: () => void;
    // Confirmed via the send button, with every target group picked — used for
    // forwarding a text message, or an image/video/audio/gif/file/poll message alike,
    // since the caller already knows the source message(s)' type/media.
    onSend: (groupIds: string[]) => void;
};

export function ForwardModal({ visible, onClose, onSend }: Props) {
    const C = getColors(useAppTheme().theme);
    const [groups, setGroups] = useState<UserGroupEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [picked, setPicked] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!visible) return;
        setPicked(new Set());
        setLoading(true);
        fetchUserGroups()
            .then(setGroups)
            .catch(() => setGroups([]))
            .finally(() => setLoading(false));
    }, [visible]);

    const toggle = (id: string) => {
        setPicked(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const confirm = () => {
        if (picked.size === 0) return;
        onSend(Array.from(picked));
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.sheet, { backgroundColor: C.card }]}>
                            <View style={styles.header}>
                                <Text style={[styles.title, { color: C.text }]}>Forward to</Text>
                                <TouchableOpacity onPress={onClose}>
                                    <Ionicons name="close" size={22} color={C.textMuted} />
                                </TouchableOpacity>
                            </View>
                            {loading ? (
                                <ActivityIndicator color={C.accent} style={styles.loading} />
                            ) : (
                                <FlatList
                                    data={groups}
                                    keyExtractor={(g) => g.groups.id}
                                    contentContainerStyle={{ paddingBottom: picked.size > 0 ? 80 : 12 }}
                                    renderItem={({ item }) => {
                                        const g = item.groups;
                                        const isPicked = picked.has(g.id);
                                        return (
                                            <TouchableOpacity
                                                style={[styles.row, { borderBottomColor: C.border }]}
                                                onPress={() => toggle(g.id)}
                                            >
                                                <Image source={g.group_image} style={styles.avatar} />
                                                <Text style={[styles.name, { color: C.text }]}>{g.name}</Text>
                                                <Ionicons
                                                    name={isPicked ? "checkmark-circle" : "ellipse-outline"}
                                                    size={22}
                                                    color={isPicked ? C.accent : C.textMuted}
                                                />
                                            </TouchableOpacity>
                                        );
                                    }}
                                    ListEmptyComponent={
                                        <Text style={[styles.empty, { color: C.textMuted }]}>No chats found</Text>
                                    }
                                />
                            )}

                            {picked.size > 0 && (
                                <TouchableOpacity
                                    onPress={confirm}
                                    style={[styles.sendBtn, { backgroundColor: C.accent }]}
                                >
                                    <Text style={styles.sendCount}>{picked.size}</Text>
                                    <Ionicons name="send" size={18} color="#fff" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    sheet: { maxHeight: "70%", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16, paddingBottom: 24 },
    header: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 20, marginBottom: 12,
    },
    title: { fontSize: 17, fontWeight: "700" },
    loading: { marginVertical: 30 },
    row: {
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
    },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    name: { fontSize: 15, fontWeight: "500", flex: 1 },
    empty: { textAlign: "center", marginVertical: 30, fontSize: 13 },
    sendBtn: {
        position: "absolute", right: 20, bottom: 24,
        flexDirection: "row", alignItems: "center", gap: 8,
        paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24,
    },
    sendCount: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
