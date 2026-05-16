import { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Share, StyleSheet, View } from "react-native";
import { Message } from "../../../shared/Types";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { MessageInput } from "../../components/chat/MessageInput";
import { MessageList } from "../../components/chat/MessageList";
import { fetchMessages, sendMessage, deleteMessage, pinMessage } from "../../services/chatService";
import { subscribeToNotifications } from "../../services/notifications";
import { supabase } from "../../../backend/src/services/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function ChatScreen({ route, navigation }: any) {

    const { group } = route.params;
    const groupId: string = group.id ?? group.groupId;

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const userIdRef = useRef<string | null>(null);
    const notifChannelRef = useRef<any>(null);

    useEffect(() => {
        const channel = supabase
            .channel(`group-${groupId}`)
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `group_id=eq.${groupId}`,
            }, (payload) => {
                const m = payload.new as any;
                setMessages(prev => [...prev, {
                    id: m.id,
                    senderId: m.sender_id,
                    senderName: m.users?.username ?? "Unknown",
                    content: m.content,
                    type: "text",
                    time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    date: m.created_at,
                    isMine: m.sender_id === userIdRef.current,
                    status: "sent",
                }]);
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
                const data = await fetchMessages(groupId);
                const mapped: Message[] = (data.messages ?? []).reverse().map((m: any) => ({
                    id: m.id,
                    senderId: m.sender_id,
                    senderName: m.users?.username ?? "Unknown",
                    content: m.content,
                    type: "text",
                    time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    date: m.created_at,
                    isMine: m.sender_id === userIdRef.current,
                    status: "read",
                }));
                setMessages(mapped);
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

    const handleSend = async () => {
        if (!input.trim()) return;
        const content = input.trim();
        setInput("");
        try {
            await sendMessage(groupId, content);
        } catch (err) {
            console.error("Send failed", err);
        }
    };

    return (
        <View style={styles.container}>
            <ChatHeader
                groupId={groupId}
                groupName={group.name ?? group.groupName}
                groupImage={group.groupImage ?? null}
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
                />
                <MessageInput
                    value={input}
                    onChange={setInput}
                    onSend={handleSend}
                    onPickImage={() => console.log("Pick image")}
                    onPickVideo={() => console.log("Pick video")}
                />
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F172A" },
    flex: { flex: 1 },
});
