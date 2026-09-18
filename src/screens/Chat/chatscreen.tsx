import { Audio } from "expo-av";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Share, StyleSheet, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";

import { Message, PollVote, RawGroupMember, RawMessage } from "../../../shared/Types";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { ForwardModal } from "../../components/chat/ForwardModal";
import { KeyboardPanel, PanelContentTab } from "../../components/chat/KeyboardPanel";
import { MessageInput } from "../../components/chat/MessageInput";
import { MessageList } from "../../components/chat/MessageList";
import { SelectionToolbar } from "../../components/chat/SelectionToolbar";
import { TypingBubble } from "../../components/chat/TypingBubble";
import {
    fetchMessages, sendMessage, deleteMessage, pinMessage, starMessage,
    unstarMessage, fetchStarredIds, markAsRead, getGroup, votePoll,
} from "../../services/chatService";
import { GifResult } from "../../services/giphy";
import { getSocket } from "../../services/socket";
import { uploadMedia } from "../../services/upload";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function ChatScreen({ route, navigation }: any) {
    const C = getColors(useAppTheme().theme);

    const { group } = route.params;
    const groupId: string = group.id ?? group.groupId;

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [recording, setRecording] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [members, setMembers] = useState<RawGroupMember[]>([]);
    const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set());
    const [panelOpen, setPanelOpen] = useState(false);
    const [panelTab, setPanelTab] = useState<PanelContentTab>("gif");
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [forwardVisible, setForwardVisible] = useState(false);
    const userIdRef = useRef<string | null>(null);
    const recorderRef = useRef<Audio.Recording | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTypingRef = useRef(false);

    useEffect(() => {
        const mapMessage = (m: RawMessage, myId: string | null, starredIds: Set<string>): Message => ({
            id: m.id,
            senderId: m.sender_id,
            senderName: m.senderName ?? "Unknown",
            content: m.content,
            type: m.type ?? "text",
            media: m.media ?? undefined,
            pollVotes: m.poll_votes ?? undefined,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            date: m.created_at,
            isMine: m.sender_id === myId,
            isPinned: m.is_pinned ?? false,
            deleted: m.deleted ?? false,
            starred: starredIds.has(m.id),
            status: m.status ?? "sent",
            replyTo: m.reply_to_message
                ? {
                    id: m.reply_to_message.id,
                    senderName: m.reply_to_message.senderName ?? "Unknown",
                    content: m.reply_to_message.content,
                  }
                : undefined,
        });

        const handleChatMessage = (m: RawMessage) => {
            if (m.group_id !== groupId) return;
            setMessages(prev => [...prev, mapMessage(m, userIdRef.current, new Set())]);
            // The real message has landed — drop any stale typing bubble for its sender.
            setTypingUserIds(prev => {
                if (!prev.has(m.sender_id)) return prev;
                const next = new Set(prev);
                next.delete(m.sender_id);
                return next;
            });
        };
        getSocket()?.on("chat:message", handleChatMessage);

        const handleTypingStart = (payload: { groupId: string; userId: string }) => {
            if (payload.groupId !== groupId || payload.userId === userIdRef.current) return;
            setTypingUserIds(prev => new Set(prev).add(payload.userId));
        };
        const handleTypingStop = (payload: { groupId: string; userId: string }) => {
            if (payload.groupId !== groupId) return;
            setTypingUserIds(prev => {
                if (!prev.has(payload.userId)) return prev;
                const next = new Set(prev);
                next.delete(payload.userId);
                return next;
            });
        };
        getSocket()?.on("typing:start", handleTypingStart);
        getSocket()?.on("typing:stop", handleTypingStop);

        const handlePollUpdate = (payload: { messageId: string; votes: PollVote[] }) => {
            setMessages(prev => prev.map(m => m.id === payload.messageId ? { ...m, pollVotes: payload.votes } : m));
        };
        getSocket()?.on("poll:update", handlePollUpdate);

        const handlePin = (payload: { messageId: string; pinned: boolean }) => {
            setMessages(prev => prev.map(m => m.id === payload.messageId ? { ...m, isPinned: payload.pinned } : m));
        };
        getSocket()?.on("chat:pin", handlePin);

        const handleRemoteDelete = (payload: { messageId: string; deleteFor: "me" | "everyone" }) => {
            if (payload.deleteFor === "everyone") {
                setMessages(prev => prev.map(m =>
                    m.id === payload.messageId ? { ...m, content: "This message was deleted", deleted: true } : m
                ));
            } else {
                // "me"-scoped events are only ever emitted back to the deleting
                // user's own room — used to sync their other devices.
                setMessages(prev => prev.filter(m => m.id !== payload.messageId));
            }
        };
        getSocket()?.on("chat:delete", handleRemoteDelete);

        const handleGroupGone = (n: { type: string; metadata?: Record<string, any> }) => {
            if (n.metadata?.groupId !== groupId) return;
            if (n.type === "chat_group_deleted") {
                Alert.alert("Group deleted", "This group was deleted.");
                navigation.navigate("ChatListScreen");
            } else if (n.type === "chat_removed_from_group" && !n.metadata?.removedUserId) {
                Alert.alert("Removed", "You were removed from this group.");
                navigation.navigate("ChatListScreen");
            }
        };
        getSocket()?.on("notification", handleGroupGone);

        async function load() {
            try {
                const token = await AsyncStorage.getItem("token");
                if (token) {
                    const payload = JSON.parse(atob(token.split(".")[1]));
                    userIdRef.current = payload.userId as string;
                }
                const [msgData, starredIds] = await Promise.all([
                    fetchMessages(groupId),
                    fetchStarredIds(groupId),
                    markAsRead(groupId).catch(() => {}),
                ]);
                const starredSet = new Set(starredIds);
                setMessages((msgData.messages ?? []).reverse().map((m) => mapMessage(m, userIdRef.current, starredSet)));

                // load group members for @mention
                const groupData = await getGroup(groupId);
                if (groupData.group.group_members) setMembers(groupData.group.group_members);
            } catch (err) {
                console.error("Failed to load messages", err);
            }
        }
        load();

        return () => {
            getSocket()?.off("chat:message", handleChatMessage);
            getSocket()?.off("typing:start", handleTypingStart);
            getSocket()?.off("typing:stop", handleTypingStop);
            getSocket()?.off("poll:update", handlePollUpdate);
            getSocket()?.off("chat:pin", handlePin);
            getSocket()?.off("chat:delete", handleRemoteDelete);
            getSocket()?.off("notification", handleGroupGone);
        };
    }, [groupId, navigation]);

    const handleDelete = (id: string) => {
        const msg = messages.find(m => m.id === id);
        const isMine = msg?.isMine;

        Alert.alert("Delete Message", "Choose an option", [
            {
                text: "Delete for Me",
                onPress: async () => {
                    try {
                        await deleteMessage(id, "me");
                        setMessages(prev => prev.filter(m => m.id !== id));
                    } catch (err) {
                        console.error("Delete for me failed", err);
                    }
                },
            },
            ...(isMine ? [{
                text: "Delete for Everyone",
                style: "destructive" as const,
                onPress: async () => {
                    try {
                        await deleteMessage(id, "everyone");
                        setMessages(prev => prev.map(m =>
                            m.id === id ? { ...m, content: "This message was deleted", deleted: true } : m
                        ));
                    } catch (err) {
                        console.error("Delete for everyone failed", err);
                    }
                },
            }] : []),
            { text: "Cancel", style: "cancel" },
        ]);
    };

    const handlePin = async (id: string) => {
        try {
            const result = await pinMessage(id, groupId);
            setMessages(prev =>
                prev.map(m => m.id === id ? { ...m, isPinned: result.pinned } : m)
            );
        } catch (err) {
            console.error("Pin failed", err);
        }
    };

    const handleShare = async (id: string) => {
        const msg = messages.find(m => m.id === id);
        if (!msg) return;
        try {
            await Share.share({
                message: msg.content,
            });
        } catch (err) {
            console.error("Share failed", err);
        }
    };

    const closePanel = () => setPanelOpen(false);

    const handlePickMedia = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images", "videos"],
            quality: 0.8,
        });
        closePanel();
        if (result.canceled || !result.assets[0]) return;
        const asset = result.assets[0];
        const isVideo = asset.type === "video";
        const ext = isVideo ? "mp4" : "jpg";
        const contentType = isVideo ? "video/mp4" : "image/jpeg";
        try {
            const uri = await uploadMedia(asset.uri, "chat", `chat.${ext}`, contentType);
            await sendMessage(groupId, uri, isVideo ? "video" : "image", { uri });
        } catch {
            Alert.alert("Failed to send media");
        }
    };

    const handleCameraCapture = async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
            Alert.alert("Camera permission required");
            return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (result.canceled || !result.assets[0]) return;
        const asset = result.assets[0];
        const isVideo = asset.type === "video";
        const ext = isVideo ? "mp4" : "jpg";
        const contentType = isVideo ? "video/mp4" : "image/jpeg";
        try {
            const uri = await uploadMedia(asset.uri, "chat", `chat.${ext}`, contentType);
            await sendMessage(groupId, uri, isVideo ? "video" : "image", { uri });
        } catch {
            Alert.alert("Failed to send media");
        }
    };

    const handlePickDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true });
        closePanel();
        if (result.canceled || !result.assets[0]) return;
        const asset = result.assets[0];
        try {
            const uri = await uploadMedia(
                asset.uri, "chat", asset.name, asset.mimeType ?? "application/octet-stream"
            );
            await sendMessage(groupId, uri, "file", {
                uri, filename: asset.name, size: asset.size ?? undefined, mimeType: asset.mimeType,
            });
        } catch {
            Alert.alert("Failed to send file");
        }
    };

    const handleSelectEmoji = (emoji: string) => setInput(prev => prev + emoji);

    const handleSendGif = async (gif: GifResult) => {
        closePanel();
        try {
            await sendMessage(groupId, gif.url, "gif", { uri: gif.url });
        } catch {
            Alert.alert("Failed to send GIF");
        }
    };

    const handleSendSticker = async (sticker: GifResult) => {
        closePanel();
        try {
            await sendMessage(groupId, sticker.url, "gif", { uri: sticker.url });
        } catch {
            Alert.alert("Failed to send sticker");
        }
    };

    const handleSendPoll = async (question: string, options: string[]) => {
        closePanel();
        try {
            await sendMessage(groupId, question, "poll", {
                options: options.map((text, i) => ({ id: String(i), text })),
                multiSelect: true,
            });
        } catch {
            Alert.alert("Failed to create poll");
        }
    };

    const handleVotePoll = async (messageId: string, optionIds: string[]) => {
        try {
            const result = await votePoll(messageId, optionIds);
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, pollVotes: result.votes } : m));
        } catch (err) {
            console.error("Vote failed", err);
        }
    };

    const handleRecordAudio = async () => {
        if (recording) {
            try {
                await recorderRef.current?.stopAndUnloadAsync();
                const uri = recorderRef.current?.getURI();
                recorderRef.current = null;
                setRecording(false);
                if (!uri) return;
                const publicUri = await uploadMedia(uri, "chat", "voice.m4a", "audio/mp4");
                await sendMessage(groupId, publicUri, "audio", { uri: publicUri });
            } catch {
                Alert.alert("Failed to send voice message");
            }
        } else {
            try {
                await Audio.requestPermissionsAsync();
                await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
                const { recording: rec } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY
                );
                recorderRef.current = rec;
                setRecording(true);
            } catch {
                Alert.alert("Microphone permission required");
            }
        }
    };

    const handleStar = async (id: string) => {
        const msg = messages.find(m => m.id === id);
        if (!msg) return;
        try {
            if (msg.starred) {
                await unstarMessage(id);
                setMessages(prev => prev.map(m => m.id === id ? { ...m, starred: false } : m));
            } else {
                await starMessage(id);
                setMessages(prev => prev.map(m => m.id === id ? { ...m, starred: true } : m));
            }
        } catch (err) {
            console.error("Star failed", err);
        }
    };

    const stopTyping = () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
        if (isTypingRef.current) {
            isTypingRef.current = false;
            getSocket()?.emit("typing:stop", { groupId });
        }
    };

    const handleInputChange = (text: string) => {
        setInput(text);
        if (!text.trim()) {
            stopTyping();
            return;
        }
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            getSocket()?.emit("typing:start", { groupId });
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(stopTyping, 2500);
    };

    useEffect(() => stopTyping, [groupId]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const content = input.trim();
        const replyId = replyingTo?.id;
        setInput("");
        setReplyingTo(null);
        stopTyping();
        try {
            await sendMessage(groupId, content, "text", undefined, replyId);
        } catch (err) {
            console.error("Send failed", err);
        }
    };

    // ─── Keyboard-swap panel ────────────────────────────────────────────────────
    const handleOpenAttachPanel = () => {
        Keyboard.dismiss();
        setPanelTab("gif");
        setPanelOpen(true);
    };

    const handleTogglePanel = () => {
        if (panelOpen && panelTab === "emoji") {
            setPanelOpen(false);
            return;
        }
        Keyboard.dismiss();
        setPanelTab("emoji");
        setPanelOpen(true);
    };

    // ─── Multi-select / bulk actions ────────────────────────────────────────────
    const enterSelection = (id: string) => {
        setSelectionMode(true);
        setSelectedIds(new Set([id]));
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            if (next.size === 0) setSelectionMode(false);
            return next;
        });
    };

    const cancelSelection = () => {
        setSelectionMode(false);
        setSelectedIds(new Set());
    };

    const selectedMessages = messages.filter(m => selectedIds.has(m.id));

    const handleBulkCopy = async () => {
        const text = selectedMessages.map(m => m.content).join("\n");
        await Clipboard.setStringAsync(text);
        cancelSelection();
    };

    const handleBulkDelete = () => {
        const allMine = selectedMessages.every(m => m.isMine);
        const ids = Array.from(selectedIds);

        Alert.alert("Delete Messages", `Delete ${ids.length} message(s)?`, [
            {
                text: "Delete for Me",
                onPress: async () => {
                    try {
                        await Promise.all(ids.map(id => deleteMessage(id, "me")));
                        setMessages(prev => prev.filter(m => !selectedIds.has(m.id)));
                    } catch (err) {
                        console.error("Bulk delete for me failed", err);
                    }
                    cancelSelection();
                },
            },
            ...(allMine ? [{
                text: "Delete for Everyone",
                style: "destructive" as const,
                onPress: async () => {
                    try {
                        await Promise.all(ids.map(id => deleteMessage(id, "everyone")));
                        setMessages(prev => prev.map(m =>
                            selectedIds.has(m.id) ? { ...m, content: "This message was deleted", deleted: true } : m
                        ));
                    } catch (err) {
                        console.error("Bulk delete for everyone failed", err);
                    }
                    cancelSelection();
                },
            }] : []),
            { text: "Cancel", style: "cancel" },
        ]);
    };

    const handleBulkForward = () => setForwardVisible(true);

    const handleForwardConfirm = async (targetGroupIds: string[]) => {
        setForwardVisible(false);
        try {
            for (const targetId of targetGroupIds) {
                for (const msg of selectedMessages) {
                    await sendMessage(targetId, msg.content, msg.type === "system" ? "text" : msg.type, msg.media);
                }
            }
        } catch (err) {
            console.error("Forward failed", err);
            Alert.alert("Failed to forward some messages");
        }
        cancelSelection();
    };

    const typingLabel = (() => {
        const names = Array.from(typingUserIds)
            .map(id => members.find(m => m.user_id === id)?.users?.username)
            .filter((n): n is string => !!n);
        if (names.length === 0) return null;
        if (names.length === 1) return `${names[0]} is typing`;
        if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
        return `${names[0]} and ${names.length - 1} others are typing`;
    })();

    return (
        <View style={[styles.container, { backgroundColor: C.background }]}>
            {selectionMode ? (
                <SelectionToolbar
                    count={selectedIds.size}
                    onCancel={cancelSelection}
                    onCopy={handleBulkCopy}
                    onForward={handleBulkForward}
                    onDelete={handleBulkDelete}
                />
            ) : (
                <ChatHeader
                    groupId={groupId}
                    groupName={group.name ?? group.groupName}
                    groupImage={group.group_image ?? group.groupImage ?? null}
                    onBack={() => navigation.goBack()}
                    onOpenControl={() => navigation.navigate("ChatControl", { groupId })}
                />
            )}
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={90}
            >
                <MessageList
                    messages={messages}
                    onDelete={handleDelete}
                    onShare={handleShare}
                    onPin={handlePin}
                    onReply={id => setReplyingTo(messages.find(m => m.id === id) ?? null)}
                    onStar={handleStar}
                    onSelect={enterSelection}
                    onVotePoll={handleVotePoll}
                    currentUserId={userIdRef.current}
                    selectionMode={selectionMode}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                />
                {typingLabel && <TypingBubble label={typingLabel} />}
                <MessageInput
                    value={input}
                    onChange={handleInputChange}
                    onSend={handleSend}
                    onCameraCapture={handleCameraCapture}
                    onRecordAudio={handleRecordAudio}
                    recording={recording}
                    replyingTo={replyingTo}
                    onCancelReply={() => setReplyingTo(null)}
                    members={members}
                    panelOpen={panelOpen}
                    onTogglePanel={handleTogglePanel}
                    onOpenAttachPanel={handleOpenAttachPanel}
                    onInputFocus={closePanel}
                />
                {panelOpen && (
                    <KeyboardPanel
                        activeTab={panelTab}
                        onTabChange={setPanelTab}
                        onSelectEmoji={handleSelectEmoji}
                        onSendGif={handleSendGif}
                        onSendSticker={handleSendSticker}
                        onSendPoll={handleSendPoll}
                        onPickGallery={handlePickMedia}
                        onPickFile={handlePickDocument}
                    />
                )}
            </KeyboardAvoidingView>

            <ForwardModal
                visible={forwardVisible}
                onClose={() => setForwardVisible(false)}
                onSend={handleForwardConfirm}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
});
