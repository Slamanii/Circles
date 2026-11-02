import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { StoryComment } from "../../../shared/Types";
import { addComment, deleteComment, fetchComments, likeComment, unlikeComment } from "../../services/story";
import { Colors } from "../../shared/theme";

type Props = {
    visible: boolean;
    onClose: () => void;
    storyId: string;
    currentUserId: string | null;
};

type Grouped = StoryComment & { replies: StoryComment[] };

export default function StoryCommentsModal({ visible, onClose, storyId, currentUserId }: Props) {
    const [comments, setComments] = useState<StoryComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState("");
    const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
    const [sending, setSending] = useState(false);

    const load = () => {
        setLoading(true);
        fetchComments(storyId)
            .then((data) => setComments(data ?? []))
            .catch(() => setComments([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (visible) load();
    }, [visible, storyId]);

    const grouped: Grouped[] = comments
        .filter((c) => !c.parent_comment_id)
        .map((c) => ({ ...c, replies: comments.filter((r) => r.parent_comment_id === c.id) }));

    const handleSend = async () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        setSending(true);
        try {
            await addComment(storyId, trimmed, replyTo?.id);
            setText("");
            setReplyTo(null);
            load();
        } catch {
            // leave the draft in place so the user can retry
        } finally {
            setSending(false);
        }
    };

    const handleToggleLike = async (comment: StoryComment) => {
        setComments((prev) => prev.map((c) =>
            c.id === comment.id
                ? { ...c, likedByViewer: !c.likedByViewer, likeCount: c.likeCount + (c.likedByViewer ? -1 : 1) }
                : c
        ));
        try {
            if (comment.likedByViewer) await unlikeComment(comment.id);
            else await likeComment(comment.id);
        } catch {
            load();
        }
    };

    const handleDelete = (commentId: string) => {
        deleteComment(commentId).then(load).catch(() => {});
    };

    const renderComment = (comment: StoryComment, isReply: boolean) => (
        <View key={comment.id} style={{ flexDirection: "row", gap: 10, paddingVertical: 8, marginLeft: isReply ? 36 : 0 }}>
            {comment.users?.avatar ? (
                <Image source={{ uri: comment.users.avatar }} style={{ width: 30, height: 30, borderRadius: 15 }} />
            ) : (
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "#2A2A2A" }} />
            )}
            <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontSize: 13 }}>
                    <Text style={{ fontWeight: "700" }}>{comment.users?.username ?? "Someone"}</Text>
                    {"  "}
                    <Text>{comment.content}</Text>
                </Text>
                <View style={{ flexDirection: "row", gap: 16, marginTop: 4 }}>
                    <TouchableOpacity onPress={() => setReplyTo({ id: comment.id, username: comment.users?.username ?? "" })}>
                        <Text style={{ color: "#9CA3AF", fontSize: 12, fontWeight: "600" }}>Reply</Text>
                    </TouchableOpacity>
                    {comment.user_id === currentUserId && (
                        <TouchableOpacity onPress={() => handleDelete(comment.id)}>
                            <Text style={{ color: "#9CA3AF", fontSize: 12, fontWeight: "600" }}>Delete</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <TouchableOpacity onPress={() => handleToggleLike(comment)} style={{ alignItems: "center", gap: 2, paddingTop: 2 }}>
                <Ionicons name={comment.likedByViewer ? "heart" : "heart-outline"} size={15} color={comment.likedByViewer ? "#EF4444" : "#9CA3AF"} />
                {comment.likeCount > 0 && <Text style={{ color: "#9CA3AF", fontSize: 11 }}>{comment.likeCount}</Text>}
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={{ flex: 1, justifyContent: "flex-end" }}>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                    <View style={{ backgroundColor: "#121212", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", paddingTop: 12 }}>
                        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#333", alignSelf: "center", marginBottom: 12 }} />
                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15, textAlign: "center", marginBottom: 8 }}>
                            Comments
                        </Text>

                        {loading ? (
                            <ActivityIndicator color="#9CA3AF" style={{ marginVertical: 24 }} />
                        ) : (
                            <FlatList
                                data={grouped}
                                keyExtractor={(c) => c.id}
                                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
                                ListEmptyComponent={
                                    <Text style={{ color: "#6B7280", textAlign: "center", marginVertical: 24, fontSize: 13 }}>
                                        No comments yet — be the first.
                                    </Text>
                                }
                                renderItem={({ item }) => (
                                    <View>
                                        {renderComment(item, false)}
                                        {item.replies.map((r) => renderComment(r, true))}
                                    </View>
                                )}
                            />
                        )}

                        {replyTo && (
                            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 6 }}>
                                <Text style={{ color: "#9CA3AF", fontSize: 12 }}>Replying to {replyTo.username}</Text>
                                <TouchableOpacity onPress={() => setReplyTo(null)}>
                                    <Text style={{ color: "#9CA3AF", fontSize: 12 }}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 16, paddingTop: 8 }}>
                            <TextInput
                                value={text}
                                onChangeText={setText}
                                placeholder={replyTo ? `Reply to ${replyTo.username}...` : "Add a comment..."}
                                placeholderTextColor="#6B7280"
                                style={{ flex: 1, backgroundColor: "#1E1E1E", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: "#fff", fontSize: 14 }}
                            />
                            <TouchableOpacity onPress={handleSend} disabled={!text.trim() || sending}>
                                <Ionicons name="send" size={22} color={text.trim() ? Colors.accentText : "#4B5563"} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}
