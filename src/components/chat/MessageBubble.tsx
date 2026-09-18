import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import {
    Modal, StyleSheet, Text, TouchableOpacity,
    TouchableWithoutFeedback, View,
} from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";
import { Message, PollOption } from "../../../shared/Types";

function formatFileSize(bytes?: number) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── File bubble ──────────────────────────────────────────────────────────────
function FileBubble({ filename, size, isMine, C }: { filename?: string; size?: number; isMine: boolean; C: any }) {
    return (
        <View style={styles.fileBubble}>
            <Ionicons name="document-text-outline" size={28} color={isMine ? "#fff" : C.accent} />
            <View style={styles.fileInfo}>
                <Text style={[isMine ? styles.textMine : styles.textOther, styles.fileName]} numberOfLines={1}>
                    {filename ?? "File"}
                </Text>
                {!!size && (
                    <Text style={[styles.fileSize, { color: isMine ? "#DBEAFE" : C.textMuted }]}>
                        {formatFileSize(size)}
                    </Text>
                )}
            </View>
        </View>
    );
}

// ─── Poll bubble ──────────────────────────────────────────────────────────────
function PollBubble({
    question, options, votes, isMine, currentUserId, onVote, C,
}: {
    question: string;
    options: PollOption[];
    votes: { user_id: string; option_id: string }[];
    isMine: boolean;
    currentUserId: string | null;
    onVote: (optionIds: string[]) => void;
    C: any;
}) {
    const totalVoters = new Set(votes.map(v => v.user_id)).size;
    const mySelected = new Set(votes.filter(v => v.user_id === currentUserId).map(v => v.option_id));

    const countFor = (optionId: string) => votes.filter(v => v.option_id === optionId).length;

    const toggleOption = (optionId: string) => {
        const next = new Set(mySelected);
        next.has(optionId) ? next.delete(optionId) : next.add(optionId);
        onVote(Array.from(next));
    };

    return (
        <View style={styles.pollBubble}>
            <Text style={[styles.pollQuestion, isMine ? styles.textMine : styles.textOther]}>{question}</Text>
            {options.map(opt => {
                const count = countFor(opt.id);
                const pct = totalVoters > 0 ? Math.round((count / totalVoters) * 100) : 0;
                const picked = mySelected.has(opt.id);
                return (
                    <TouchableOpacity
                        key={opt.id}
                        style={[
                            styles.pollOption,
                            { borderColor: picked ? C.accent : (isMine ? "rgba(255,255,255,0.4)" : C.border) },
                        ]}
                        onPress={() => toggleOption(opt.id)}
                    >
                        <View style={[
                            styles.pollBar,
                            { width: `${pct}%`, backgroundColor: isMine ? "rgba(255,255,255,0.25)" : C.accent + "33" },
                        ]} />
                        <Ionicons
                            name={picked ? "checkmark-circle" : "ellipse-outline"}
                            size={16}
                            color={picked ? C.accent : (isMine ? "#fff" : C.textMuted)}
                        />
                        <Text style={[styles.pollOptionText, isMine ? styles.textMine : styles.textOther]}>
                            {opt.text}
                        </Text>
                        <Text style={[styles.pollOptionPct, { color: isMine ? "#DBEAFE" : C.textMuted }]}>
                            {count > 0 ? `${pct}%` : ""}
                        </Text>
                    </TouchableOpacity>
                );
            })}
            <Text style={[styles.pollVoters, { color: isMine ? "#DBEAFE" : C.textMuted }]}>
                {totalVoters} vote{totalVoters === 1 ? "" : "s"}
            </Text>
        </View>
    );
}

// ─── Audio bubble ─────────────────────────────────────────────────────────────
function AudioBubble({ uri, isMine }: { uri: string; isMine: boolean }) {
    const soundRef = useRef<Audio.Sound | null>(null);
    const [playing, setPlaying] = useState(false);
    const toggle = async () => {
        if (playing) {
            await soundRef.current?.pauseAsync();
            setPlaying(false);
        } else {
            if (!soundRef.current) {
                const { sound } = await Audio.Sound.createAsync({ uri });
                soundRef.current = sound;
                sound.setOnPlaybackStatusUpdate(s => {
                    if (s.isLoaded && s.didJustFinish) { setPlaying(false); soundRef.current = null; }
                });
            }
            await soundRef.current.playAsync();
            setPlaying(true);
        }
    };
    return (
        <TouchableOpacity onPress={toggle} style={styles.audioBubble}>
            <Text style={[styles.audioIcon, isMine && { color: "#fff" }]}>{playing ? "⏸" : "▶"}</Text>
            <View style={[styles.audioWave, isMine ? styles.audioWaveMine : styles.audioWaveOther]} />
        </TouchableOpacity>
    );
}

// ─── Mention-aware text ───────────────────────────────────────────────────────
function MentionText({ content, isMine, accent }: { content: string; isMine: boolean; accent: string }) {
    const parts = content.split(/(@\w+)/g);
    return (
        <Text style={isMine ? styles.textMine : styles.textOther}>
            {parts.map((part, i) =>
                /^@\w+/.test(part)
                    ? <Text key={i} style={[styles.mention, { color: isMine ? "#fff" : accent }]}>{part}</Text>
                    : part
            )}
        </Text>
    );
}

// ─── Reply preview inside bubble ─────────────────────────────────────────────
function ReplyPreview({ reply, C }: { reply: NonNullable<Message["replyTo"]>; C: any }) {
    return (
        <View style={[styles.replyPreview, { backgroundColor: C.background, borderLeftColor: C.accent }]}>
            <Text style={[styles.replySender, { color: C.accent }]}>{reply.senderName}</Text>
            <Text style={[styles.replyContent, { color: C.textSecondary }]} numberOfLines={1}>
                {reply.content}
            </Text>
        </View>
    );
}

// ─── Action menu modal ────────────────────────────────────────────────────────
type Action = { label: string; icon: string; onPress: () => void; danger?: boolean };

function ActionMenu({ visible, actions, onClose, C }: {
    visible: boolean; actions: Action[]; onClose: () => void; C: any;
}) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.menuOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.menuSheet, { backgroundColor: C.card }]}>
                            {actions.map((a, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.menuItem, i < actions.length - 1 && { borderBottomColor: C.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                                    onPress={() => { a.onPress(); onClose(); }}
                                >
                                    <Text style={styles.menuIcon}>{a.icon}</Text>
                                    <Text style={[styles.menuLabel, { color: a.danger ? "#F87171" : C.text }]}>{a.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

// ─── Main bubble ──────────────────────────────────────────────────────────────
type Props = {
    message: Message;
    onDelete: () => void;
    onShare: () => void;
    onPin: () => void;
    onReply: () => void;
    onStar: () => void;
    onSelect: () => void;
    onVotePoll: (optionIds: string[]) => void;
    currentUserId: string | null;
    selectionMode: boolean;
    selected: boolean;
    onToggleSelect: () => void;
};

const STATUS_ICON: Record<string, string> = {
    sending: "🕐", sent: "✓", delivered: "✓✓", read: "✓✓",
};

export function MessageBubble({
    message, onDelete, onShare, onPin, onReply, onStar, onSelect, onVotePoll, currentUserId,
    selectionMode, selected, onToggleSelect,
}: Props) {
    const C = getColors(useAppTheme().theme);
    const [menuVisible, setMenuVisible] = useState(false);
    const { isMine, type, deleted, isPinned, status, starred } = message;

    const handleLongPress = async () => {
        if (selectionMode) return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setMenuVisible(true);
    };

    const handlePress = () => {
        if (selectionMode) onToggleSelect();
    };

    const handleCopy = async () => {
        await Clipboard.setStringAsync(message.content);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    if (type === "system") {
        return <Text style={[styles.system, { color: C.textSecondary }]}>{message.content}</Text>;
    }

    const actions: Action[] = [
        { label: "Reply",  icon: "↩️",  onPress: onReply },
        { label: "Copy",   icon: "📋",  onPress: handleCopy },
        { label: starred ? "Unstar" : "Star", icon: starred ? "⭐" : "☆", onPress: onStar },
        { label: isPinned ? "Unpin" : "Pin", icon: "📌", onPress: onPin },
        { label: "Share",  icon: "✈️",  onPress: onShare },
        { label: "Select", icon: "☑️",  onPress: onSelect },
        { label: "Delete", icon: "🗑️",  onPress: onDelete, danger: true },
    ];

    return (
        <>
            <TouchableOpacity
                onLongPress={handleLongPress}
                onPress={handlePress}
                delayLongPress={350}
                activeOpacity={0.85}
                style={[styles.row, isMine ? styles.rowMine : styles.rowOther]}
            >
                {selectionMode && isMine && (
                    <Ionicons
                        name={selected ? "checkmark-circle" : "ellipse-outline"}
                        size={22}
                        color={selected ? C.accent : C.textMuted}
                        style={styles.selectDot}
                    />
                )}
                <View style={[
                    styles.bubble,
                    isMine ? styles.bubbleMine : [styles.bubbleOther, { backgroundColor: C.surface }],
                    starred && styles.bubbleStarred,
                ]}>
                    {!isMine && <Text style={styles.senderName}>{message.senderName}</Text>}
                    {isPinned && <Text style={styles.pinned}>📌 Pinned</Text>}

                    {message.replyTo && <ReplyPreview reply={message.replyTo} C={C} />}

                    {deleted ? (
                        <Text style={[styles.deleted, { color: C.textMuted }]}>This message was deleted</Text>
                    ) : type === "text" ? (
                        <MentionText content={message.content} isMine={isMine} accent={C.accent} />
                    ) : type === "image" || type === "gif" ? (
                        <Image source={{ uri: message.media?.uri ?? message.content }} style={styles.image} />
                    ) : type === "video" ? (
                        <View style={styles.videoWrap}>
                            <Image source={{ uri: message.media?.thumbnail }} style={styles.image} />
                            <Text style={styles.videoIcon}>▶</Text>
                        </View>
                    ) : type === "audio" ? (
                        <AudioBubble uri={message.media?.uri ?? message.content} isMine={isMine} />
                    ) : type === "file" ? (
                        <FileBubble filename={message.media?.filename} size={message.media?.size} isMine={isMine} C={C} />
                    ) : type === "poll" ? (
                        <PollBubble
                            question={message.content}
                            options={message.media?.options ?? []}
                            votes={message.pollVotes ?? []}
                            isMine={isMine}
                            currentUserId={currentUserId}
                            onVote={onVotePoll}
                            C={C}
                        />
                    ) : null}

                    <View style={styles.meta}>
                        {starred && <Text style={styles.starIcon}>⭐</Text>}
                        <Text style={[styles.time, isMine ? styles.timeMine : { color: C.textMuted }]}>
                            {message.time}
                        </Text>
                        {isMine && status && (
                            <Text style={[styles.status, status === "read" && styles.statusRead]}>
                                {STATUS_ICON[status]}
                            </Text>
                        )}
                    </View>
                </View>
                {selectionMode && !isMine && (
                    <Ionicons
                        name={selected ? "checkmark-circle" : "ellipse-outline"}
                        size={22}
                        color={selected ? C.accent : C.textMuted}
                        style={styles.selectDot}
                    />
                )}
            </TouchableOpacity>

            <ActionMenu
                visible={menuVisible}
                actions={actions}
                onClose={() => setMenuVisible(false)}
                C={C}
            />
        </>
    );
}

const styles = StyleSheet.create({
    row:           { marginVertical: 4, marginHorizontal: 12, flexDirection: "row" },
    rowMine:       { justifyContent: "flex-end" },
    rowOther:      { justifyContent: "flex-start" },
    bubble:        { maxWidth: "75%", borderRadius: 16, padding: 10 },
    bubbleMine:    { backgroundColor: "#299FFF", borderBottomRightRadius: 4 },
    bubbleOther:   { borderBottomLeftRadius: 4 },
    bubbleStarred: { borderWidth: 1, borderColor: "#FBBF24" },
    senderName:    { fontSize: 12, fontWeight: "600", color: "#94A3B8", marginBottom: 4 },
    pinned:        { fontSize: 11, color: "#FCD34D", marginBottom: 4 },
    // reply preview
    replyPreview:  { borderLeftWidth: 3, borderRadius: 6, padding: 6, marginBottom: 6 },
    replySender:   { fontSize: 11, fontWeight: "700", marginBottom: 2 },
    replyContent:  { fontSize: 12 },
    // text
    textMine:      { color: "white", fontSize: 15 },
    textOther:     { fontSize: 15 },
    mention:       { fontWeight: "700" },
    deleted:       { fontStyle: "italic", fontSize: 14 },
    // media
    image:         { width: 200, height: 200, borderRadius: 10 },
    videoWrap:     { width: 200, height: 200, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    videoIcon:     { position: "absolute", fontSize: 36, color: "white" },
    // audio
    audioBubble:   { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4, minWidth: 140 },
    audioIcon:     { fontSize: 20, color: "#94A3B8" },
    audioWave:     { flex: 1, height: 3, borderRadius: 2 },
    audioWaveMine: { backgroundColor: "rgba(255,255,255,0.5)" },
    audioWaveOther:{ backgroundColor: "#475569" },
    // file
    fileBubble:    { flexDirection: "row", alignItems: "center", gap: 10, minWidth: 160, maxWidth: 220 },
    fileInfo:      { flex: 1 },
    fileName:      { fontWeight: "600" },
    fileSize:      { fontSize: 11, marginTop: 2 },
    // poll
    pollBubble:    { minWidth: 220, maxWidth: 260, gap: 8 },
    pollQuestion:  { fontWeight: "700", marginBottom: 4 },
    pollOption:    {
        flexDirection: "row", alignItems: "center", gap: 8,
        borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
        overflow: "hidden",
    },
    pollBar:       { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 10 },
    pollOptionText:{ flex: 1, fontSize: 14 },
    pollOptionPct: { fontSize: 12, fontWeight: "600" },
    pollVoters:    { fontSize: 11, marginTop: 2 },
    // selection
    selectDot:     { alignSelf: "center", marginHorizontal: 8 },
    // meta
    meta:          { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 4, gap: 4 },
    starIcon:      { fontSize: 10 },
    time:          { fontSize: 10 },
    timeMine:      { color: "#DBEAFE" },
    status:        { fontSize: 10, color: "#94A3B8" },
    statusRead:    { color: "#60A5FA" },
    system:        { alignSelf: "center", fontSize: 12, marginVertical: 8, fontStyle: "italic" },
    // action menu
    menuOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
    menuSheet:     { borderRadius: 16, width: 220, overflow: "hidden" },
    menuItem:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    menuIcon:      { fontSize: 18, width: 26, textAlign: "center" },
    menuLabel:     { fontSize: 15, fontWeight: "500" },
});
