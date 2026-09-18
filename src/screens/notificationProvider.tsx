import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { navigationRef } from "../App";
import { registerForPushNotifications, AppNotification } from "../services/notifications";
import { connectSocket, disconnectSocket, getSocket } from "../services/socket";
import { NotificationType } from "../../shared/notificationTypes";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export default function NotificationListener({ userId }: { userId: string }) {
    useEffect(() => {
        if (process.env.EXPO_PUBLIC_EAS_PROJECT_ID) {
            registerForPushNotifications().catch(console.error);
        }

        const onNotification = (n: AppNotification) => {
            Notifications.scheduleNotificationAsync({
                content: {
                    title: n.title ?? "Fuego",
                    body: n.body ?? "",
                    data: {
                        type: n.type,
                        reference_id: n.reference_id,
                        reference_type: n.reference_type,
                        ...n.metadata,
                    },
                },
                trigger: null,
            });
        };

        const onChatMessage = (m: any) => {
            if (m.sender_id === userId) return;
            Notifications.scheduleNotificationAsync({
                content: {
                    title: m.senderName ?? "New message",
                    body: m.content ?? "",
                    data: { type: "chat_message", groupId: m.group_id },
                },
                trigger: null,
            });
        };

        let cancelled = false;
        connectSocket().then(s => {
            if (cancelled || !s) return;
            s.on("notification", onNotification);
            s.on("chat:message", onChatMessage);
        });

        // Tap handler — routes to the relevant screen. Exhaustive over
        // NotificationType so a new type added to the shared union without a
        // matching case here fails to compile.
        const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
            const d = response.notification.request.content.data as
                Partial<Record<
                    "type" | "reference_id" | "reference_type" | "groupId" |
                    "followerId" | "eventId" | "storyId" | "subId" | "ticketId",
                    string
                >>;
            if (!navigationRef.isReady() || !d.type) return;

            const type = d.type as NotificationType;
            switch (type) {
                case "chat_message":
                case "chat_mention":
                case "chat_removed_from_group":
                case "chat_member_left":
                case "chat_made_admin":
                case "chat_group_deleted":
                    navigationRef.navigate("ChatListScreen", { chatId: d.groupId ?? d.reference_id ?? "" });
                    break;
                case "follow_new":
                    navigationRef.navigate("UserProfile", { followingId: d.followerId ?? d.reference_id ?? "" });
                    break;
                case "event_liked":
                case "event_mint_complete":
                case "event_mint_failed": {
                    const eventId = d.eventId ?? d.reference_id;
                    if (eventId) navigationRef.navigate("EventDetails", { eventId });
                    break;
                }
                case "story_liked":
                    if (d.storyId) navigationRef.navigate("StoryDetail", { storyId: d.storyId, subId: d.subId });
                    break;
                case "collectible_received":
                case "collectible_purchase_confirmed": {
                    const ticketId = d.ticketId ?? d.reference_id;
                    if (ticketId) navigationRef.navigate("TicketInfo", { ticketId });
                    break;
                }
                case "wallet_reservation_refunded":
                    navigationRef.navigate("Wallet-history");
                    break;
                default: {
                    const _exhaustive: never = type;
                    void _exhaustive;
                }
            }
        });

        return () => {
            cancelled = true;
            const s = getSocket();
            s?.off("notification", onNotification);
            s?.off("chat:message", onChatMessage);
            disconnectSocket();
            responseSub.remove();
        };
    }, [userId]);

    return null;
}
