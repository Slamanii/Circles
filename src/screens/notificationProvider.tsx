import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { navigationRef } from "../App";
import { registerForPushNotifications, subscribeToNotifications } from "../services/notifications";
import { supabase } from "../services/supabase";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

async function subscribeToChatMessages(userId: string) {
    // Fetch the groups this user belongs to so we can filter message inserts
    const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", userId);

    const groupIds = (memberships ?? []).map((m: any) => m.group_id);
    if (!groupIds.length) return null;

    return supabase
        .channel(`chat-push-${userId}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `group_id=in.(${groupIds.join(",")})`,
            },
            (payload) => {
                const m = payload.new as any;
                // Don't notify the sender
                if (m.sender_id === userId) return;

                Notifications.scheduleNotificationAsync({
                    content: {
                        title: m.senderName ?? "New message",
                        body: m.content ?? "",
                        data: { type: "chat", groupId: m.group_id },
                    },
                    trigger: null,
                });
            },
        )
        .subscribe();
}

export default function NotificationListener({ userId }: { userId: string }) {
    useEffect(() => {
        if (process.env.EXPO_PUBLIC_EAS_PROJECT_ID) {
            registerForPushNotifications().catch(console.error);
        }

        // Notifications table → in-app panel types (mention, event, collectible, wallet)
        const notifChannel = subscribeToNotifications(userId);

        // Messages table → chat device push with sender name + content preview
        let msgChannel: Awaited<ReturnType<typeof subscribeToChatMessages>> = null;
        let cancelled = false;
        subscribeToChatMessages(userId).then(ch => {
            if (cancelled) { ch?.unsubscribe(); return; }
            msgChannel = ch;
        });

        // Tap handler — routes to the relevant screen
        const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data;
            if (!navigationRef.isReady()) return;

            const d = data as Record<string, string> | undefined;
            switch (d?.type) {
                case "chat":
                case "mention":
                    navigationRef.navigate("ChatListScreen", { chatId: d.groupId ?? d.reference_id ?? "" });
                    break;
                case "event":
                    if (d.eventId) navigationRef.navigate("EventDetails", { eventId: d.eventId });
                    break;
                case "collectible":
                    if (d.ticketId) navigationRef.navigate("TicketInfo", { ticketId: d.ticketId });
                    break;
            }
        });

        return () => {
            cancelled = true;
            notifChannel.unsubscribe();
            msgChannel?.unsubscribe();
            responseSub.remove();
        };
    }, [userId]);

    return null;
}
