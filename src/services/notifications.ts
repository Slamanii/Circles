import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./apiClient";
import { NotificationRow } from "../../shared/notificationTypes";

export type { NotificationType } from "../../shared/notificationTypes";
export type AppNotification = NotificationRow & { message?: string };

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

export async function registerForPushNotifications(): Promise<string | null> {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return null;

    // Explicit projectId — auto-inference from app config isn't reliable in
    // standalone/EAS builds, and a wrong/missing token here means push silently
    // never arrives with no error surfaced anywhere.
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
        console.error("registerForPushNotifications: missing EAS projectId in app config");
        return null;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const pushToken = tokenData.data;

    await AsyncStorage.setItem("push_token", pushToken);

    // Send to the backend so server-initiated push can target this device
    await api.post("/api/save-push-token", { token: pushToken }, "Failed to save push token").catch(console.error);

    return pushToken;
}
