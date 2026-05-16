import axios from "axios"

export async function sendPushNotification(token: string, title: string, body: string) {

    await axios.post("https://exp.host/--/api/v2/push/send", {
        to: token,
        sound: "default",
        title,
        body,
    });
}