import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Share, StyleSheet, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";

import { Message } from "../../../shared/Types";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { MessageInput } from "../../components/chat/MessageInput";
import { MessageList } from "../../components/chat/MessageList";
import { fetchMessages, sendMessage, deleteMessage, pinMessage, starMessage, unstarMessage, fetchStarredIds } from "../../services/chatService";
import { subscribeToNotifications } from "../../services/notifications";
import { uploadMedia } from "../../services/upload";
import { supabase } from "../../services/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function ChatScreen({ route, navigation }: any) {
    const C = getColors(useAppTheme().theme);

    const { group } = route.params;
    const groupId: string = group.id ?? group.groupId;

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [recording, setRecording] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [members, setMembers] = useState<any[]>([]);
    const userIdRef = useRef<string | null>(null);
    const notifChannelRef = useRef<any>(null);
    const recorderRef = useRef<Audio.Recording | null>(null);

    useEffect(() => {
        const mapMessage = (m: any, myId: string | null, starredIds: Set<string>): Message => ({
            id: m.id,
            senderId: m.sender_id,
            senderName: m.senderName ?? m.users?.username ?? "Unknown",
            content: m.content,
            type: m.type ?? "text",
            media: m.media ?? undefined,
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

        const channel = supabase
            .channel(`group-${groupId}`)
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `group_id=eq.${groupId}`,
            }, (payload) => {
                setMessages(prev => [...prev, mapMessage(payload.new, userIdRef.current, new Set())]);
            })
            .subscribe();

        async function load() {
            try {
                const token = await AsyncStorage.getItem("token");
                if (token) {
                    const payload = JSON.parse(atob(token.split(".")[1]));
                    userIdRef.current = payload.userId as string;
                    notifChannelRef.current = subscribeToNotifications(userIdRef.current);
                }
                const [msgData, starredIds] = await Promise.all([
                    fetchMessages(groupId),
                    fetchStarredIds(groupId),
                ]);
                const starredSet = new Set(starredIds);
                setMessages((msgData.messages ?? []).reverse().map((m: any) => mapMessage(m, userIdRef.current, starredSet)));

                // load group members for @mention
                const { data: groupData } = await (await import("../../services/chatService")).getGroup(groupId) as any;
                if (groupData?.group?.group_members) setMembers(groupData.group.group_members);
            } catch (err) {
                console.error("Failed to load messages", err);
            }
        }
        load();

        return () => {
            supabase.removeChannel(channel);
            if (notifChannelRef.current) supabase.removeChannel(notifChannelRef.current);
        };
    }, [groupId]);

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

    const handlePickMedia = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images", "videos"],
            quality: 0.8,
        });
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

    const handleSend = async () => {
        if (!input.trim()) return;
        const content = input.trim();
        const replyId = replyingTo?.id;
        setInput("");
        setReplyingTo(null);
        try {
            await sendMessage(groupId, content, "text", undefined, replyId);
        } catch (err) {
            console.error("Send failed", err);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: C.background }]}>
            <ChatHeader
                groupId={groupId}
                groupName={group.name ?? group.groupName}
                groupImage={group.group_image ?? group.groupImage ?? null}
                onBack={() => navigation.goBack()}
                onOpenControl={() => navigation.navigate("ChatControl", { groupId })}
            />
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
                />
                <MessageInput
                    value={input}
                    onChange={setInput}
                    onSend={handleSend}
                    onPickImage={handlePickMedia}
                    onRecordAudio={handleRecordAudio}
                    recording={recording}
                    replyingTo={replyingTo}
                    onCancelReply={() => setReplyingTo(null)}
                    members={members}
                />
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
});
