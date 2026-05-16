import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
