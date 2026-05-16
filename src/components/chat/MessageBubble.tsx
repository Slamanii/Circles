import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"

type Props = {
    message: {
        id: string;
        senderId: string;
        senderName: string;
        content: string;
        type: "text" | "image" | "video" | "system";
        time: string;
        isMine: boolean;
        isPinned?: boolean;
        deleted?: boolean;
        status?: "sending" | "sent" | "delivered" | "read";
        media?: { uri: string; thumbnail?: string };
    };
    onDelete: () => void;
    onShare: () => void;
    onPin: () => void;
};

const STATUS_ICON: Record<string, string> = {
    sending: "🕐",
    sent: "✓",
    delivered: "✓✓",
    read: "✓✓",
};

export function MessageBubble({ message, onDelete, onShare, onPin }: Props) {

    const { isMine, type, deleted, isPinned, status } = message;

    // system messages — centered, no bubble
    if (type === "system") {
        return (
            <Text style={styles.system}>{message.content}</Text>
        );
    }

    return (
        <View style={[styles.row, isMine ? styles.rowMine : styles.rowOther]}>
            <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>

                {/* sender name — only for other people's messages */}
                {!isMine && (
                    <Text style={styles.senderName}>{message.senderName}</Text>
                )}

                {/* pinned indicator */}
                {isPinned && (
                    <Text style={styles.pinned}>📌 Pinned</Text>
                )}

                {/* content */}
                {deleted ? (
                    <Text style={styles.deleted}>This message was deleted</Text>
                ) : type === "text" ? (
                    <Text style={isMine ? styles.textMine : styles.textOther}>
                        {message.content}
                    </Text>
                ) : type === "image" ? (
                    <Image
                        source={{ uri: message.media?.uri ?? message.content }}
                        style={styles.image}
                    />
                ) : type === "video" ? (
                    <View style={styles.videoPlaceholder}>
                        <Image
                            source={{ uri: message.media?.thumbnail }}
                            style={styles.image}
                        />
                        <Text style={styles.videoIcon}>▶</Text>
                    </View>
                ) : null}

                {/* time + status row */}
                <View style={styles.meta}>
                    <Text style={[styles.time, isMine ? styles.timeMine : styles.timeOther]}>
                        {message.time}
                    </Text>
                    {isMine && status && (
                        <Text style={[
                            styles.status,
                            status === "read" && styles.statusRead,
                        ]}>
                            {STATUS_ICON[status]}
                        </Text>
                    )}
                </View>

                {/* actions */}
                {!deleted && (
                    <View style={styles.actions}>
                        <TouchableOpacity onPress={onShare} style={styles.action}>
                            <Text style={styles.actionIcon}>✈️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onPin} style={styles.action}>
                            <Text style={styles.actionIcon}>📌</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onDelete} style={styles.action}>
                            <Text style={styles.actionIcon}>🗑️</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        marginVertical: 4,
        marginHorizontal: 12,
        flexDirection: "row",
    },
    rowMine: {
        justifyContent: "flex-end",
    },
    rowOther: {
        justifyContent: "flex-start",
    },
    bubble: {
        maxWidth: "75%",
        borderRadius: 16,
        padding: 10,
    },
    bubbleMine: {
        backgroundColor: "#299FFF",
        borderBottomRightRadius: 4,
    },
    bubbleOther: {
        backgroundColor: "#1E293B",
        borderBottomLeftRadius: 4,
    },
    senderName: {
        fontSize: 12,
        fontWeight: "600",
        color: "#94A3B8",
        marginBottom: 4,
    },
    pinned: {
        fontSize: 11,
        color: "#FCD34D",
        marginBottom: 4,
    },
    textMine: {
        color: "white",
        fontSize: 15,
    },
    textOther: {
        color: "#F1F5F9",
        fontSize: 15,
    },
    deleted: {
        color: "#94A3B8",
        fontStyle: "italic",
        fontSize: 14,
    },
    image: {
        width: 200,
        height: 200,
        borderRadius: 10,
    },
    videoPlaceholder: {
        width: 200,
        height: 200,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    videoIcon: {
        position: "absolute",
        fontSize: 36,
        color: "white",
    },
    meta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginTop: 4,
        gap: 4,
    },
    time: {
        fontSize: 10,
    },
    timeMine: {
        color: "#DBEAFE",
    },
    timeOther: {
        color: "#64748B",
    },
    status: {
        fontSize: 10,
        color: "#94A3B8",
    },
    statusRead: {
        color: "#60A5FA",
    },
    actions: {
        flexDirection: "row",
        marginTop: 6,
        gap: 8,
    },
    action: {
        padding: 2,
    },
    actionIcon: {
        fontSize: 14,
    },
    system: {
        alignSelf: "center",
        color: "#64748B",
        fontSize: 12,
        marginVertical: 8,
        fontStyle: "italic",
    },
});
