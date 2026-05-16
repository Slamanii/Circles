import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { navigationRef } from "../App";
import { registerForPushNotifications, subscribeToNotifications } from "../services/notifications";

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
        // Request permission + register push token once on mount
        registerForPushNotifications().catch(console.error);

        // Realtime DB subscription → fires local push when notification row inserted
        const channel = subscribeToNotifications(userId);

        // Handle tap on a notification (foreground or background)
        const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data;
            if (!navigationRef.isReady()) return;

            switch (data?.type) {
                case "chat":
                    if (typeof data.chatId === "string")
                        navigationRef.navigate("ChatListScreen", { chatId: data.chatId });
                    break;
                case "event":
                    if (typeof data.eventId === "string")
                        navigationRef.navigate("EventDetails", { eventId: data.eventId });
                    break;
                case "collectible":
                    if (typeof data.ticketId === "string")
                        navigationRef.navigate("TicketInfo", { ticketId: data.ticketId });
                    break;
            }
        });

        return () => {
            channel.unsubscribe();
            responseSub.remove();
        };
    }, [userId]);

    return null;
}
