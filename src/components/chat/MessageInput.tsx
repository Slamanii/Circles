import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    FlatList, StyleSheet, Text, TextInput,
    TouchableOpacity, View,
} from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";
import { Message } from "../../../shared/Types";

type Member = { user_id: string; users?: { username: string } };

type Props = {
    value: string;
    onChange: (text: string) => void;
    onSend: () => void;
    onPickImage: () => void;
    onRecordAudio: () => void;
    recording?: boolean;
    replyingTo?: Message | null;
    onCancelReply?: () => void;
    members?: Member[];
};

export function MessageInput({
    value, onChange, onSend, onPickImage, onRecordAudio,
    recording = false, replyingTo, onCancelReply, members = [],
}: Props) {
    const C = getColors(useAppTheme().theme);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);

    // Detect @mention context every time text changes
    useEffect(() => {
        const match = value.match(/@(\w*)$/);
        setMentionQuery(match ? match[1] : null);
    }, [value]);

    const suggestions = mentionQuery !== null
        ? members.filter(m =>
            m.users?.username?.toLowerCase().startsWith(mentionQuery.toLowerCase())
          ).slice(0, 5)
        : [];

    const insertMention = (username: string) => {
        const updated = value.replace(/@\w*$/, `@${username} `);
        onChange(updated);
        setMentionQuery(null);
    };

    return (
        <View>
            {/* @mention suggestions */}
            {suggestions.length > 0 && (
                <View style={[styles.suggestionsBox, { backgroundColor: C.card, borderTopColor: C.border }]}>
                    <FlatList
                        data={suggestions}
                        keyExtractor={m => m.user_id}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.suggestion, { borderBottomColor: C.border }]}
                                onPress={() => insertMention(item.users!.username)}
                            >
                                <Text style={[styles.suggestionText, { color: C.text }]}>
                                    @{item.users?.username}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Reply banner */}
            {replyingTo && (
                <View style={[styles.replyBanner, { backgroundColor: C.surface, borderLeftColor: C.accent }]}>
                    <View style={styles.replyInfo}>
                        <Text style={[styles.replyLabel, { color: C.accent }]}>
                            Replying to {replyingTo.senderName}
                        </Text>
                        <Text style={[styles.replySnippet, { color: C.textSecondary }]} numberOfLines={1}>
                            {replyingTo.content}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onCancelReply} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close" size={18} color={C.textMuted} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Input row */}
            <View style={[styles.row, { borderTopColor: C.border, backgroundColor: C.card }]}>
                <TouchableOpacity onPress={onPickImage} style={styles.iconBtn}>
                    <Ionicons name="image-outline" size={22} color={C.textSecondary} />
                </TouchableOpacity>

                <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="Message..."
                    placeholderTextColor={C.textMuted}
                    style={[styles.input, { backgroundColor: C.surface, color: C.text }]}
                    multiline
                />

                <TouchableOpacity onPress={onRecordAudio} style={styles.iconBtn}>
                    <Ionicons
                        name={recording ? "stop-circle" : "mic-outline"}
                        size={22}
                        color={recording ? "#EF4444" : C.textSecondary}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onSend}
                    disabled={!value.trim()}
                    style={[styles.sendBtn, { backgroundColor: value.trim() ? C.accent : C.surface }]}
                >
                    <Ionicons name="send" size={18} color={value.trim() ? "#fff" : C.textMuted} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    suggestionsBox: {
        maxHeight: 180,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    suggestion: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    suggestionText: { fontSize: 14, fontWeight: "500" },
    replyBanner: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderLeftWidth: 3,
        gap: 8,
    },
    replyInfo:    { flex: 1 },
    replyLabel:   { fontSize: 12, fontWeight: "700", marginBottom: 2 },
    replySnippet: { fontSize: 12 },
    row: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        gap: 6,
    },
    iconBtn: { padding: 6, justifyContent: "center" },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        fontSize: 15,
        maxHeight: 100,
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
});
