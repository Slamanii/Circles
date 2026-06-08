import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function authHeaders() {
    const token = await AsyncStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

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
    const res = await fetch(
        `${API_URL}/api/notifications?limit=${limit}&offset=${offset}`,
        { headers: await authHeaders() },
    );
    if (!res.ok) throw new Error("Failed to fetch notifications");
    const json = await res.json();
    return json.notifications as AppNotification[];
}

export async function markAllNotificationsRead(): Promise<void> {
    const res = await fetch(`${API_URL}/api/mark-notification-read`, {
        method: "POST",
        headers: await authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to mark notifications read");
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
                const n = payload.new as any;
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

    // Persist so the backend can send targeted push notifications
    await AsyncStorage.setItem("push_token", pushToken);

    return pushToken;
}
