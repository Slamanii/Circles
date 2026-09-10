import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { api } from "./apiClient";

export type AppNotification = {
    id: string;
    type: "chat" | "event" | "collectible" | "wallet" | "mention" | "like" | "follow";
    title: string;
    body?: string;
    message?: string;
    reference_id?: string;
    reference_type?: string;
    is_read: boolean;
    created_at: string;
    metadata?: Record<string, any>;
};

export async function fetchNotifications(limit = 30, offset = 0): Promise<AppNotification[]> {
    const json = await api.get<{ notifications: AppNotification[] }>(
        `/api/notifications?limit=${limit}&offset=${offset}`,
        "Failed to fetch notifications",
    );
    return json.notifications;
}

export async function markAllNotificationsRead(): Promise<void> {
    await api.post("/api/mark-notification-read", undefined, "Failed to mark notifications read");
}

export function subscribeToNotifications(userId: string) {
    const channel = supabase
        .channel(`user-notifications-${userId}`)
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "notifications",
                filter: `user_id=eq.${userId}`,
            },
            (payload) => {
                const n = payload.new as AppNotification;
                Notifications.scheduleNotificationAsync({
                    content: {
                        title: n.title ?? "Fuego",
                        body: n.body ?? "",
                        data: { type: n.type, ...n.metadata },
                    },
                    trigger: null,
                });
            }
        )
        .subscribe();

    return channel;
}

export async function registerForPushNotifications(): Promise<string | null> {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return null;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const pushToken = tokenData.data;

    await AsyncStorage.setItem("push_token", pushToken);

    // Send to the backend so server-initiated push can target this device
    await api.post("/api/save-push-token", { token: pushToken }, "Failed to save push token").catch(console.error);

    return pushToken;
}
