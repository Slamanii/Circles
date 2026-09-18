import axios from "axios"

export async function sendPushNotification(
    token: string, title: string, body: string, data?: Record<string, any>, imageUrl?: string,
) {

    await axios.post("https://exp.host/--/api/v2/push/send", {
        to: token,
        sound: "default",
        title,
        body,
        data,
        // Expo relays this into the platform's rich-notification image slot
        // (Android big-picture / iOS attachment) — omitted entirely when unset
        // rather than sent as undefined, so devices without an avatar get a
        // plain notification instead of a broken image.
        ...(imageUrl ? { richContent: { image: imageUrl } } : {}),
    });
}