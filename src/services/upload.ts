import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function authHeaders() {
    const token = await AsyncStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

type Bucket = "stories" | "avatars" | "event-flyers" | "chat";

export async function uploadMedia(
    localUri: string,
    bucket: Bucket,
    filename: string,
    contentType: string,
): Promise<string> {
    const urlRes = await fetch(`${API_URL}/api/upload-url`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ bucket, filename, contentType }),
    });
    if (!urlRes.ok) throw new Error("Failed to get upload URL");
    const { signedUrl, publicUrl } = await urlRes.json();

    const fileRes = await fetch(localUri);
    const blob = await fileRes.blob();
    const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: blob,
    });
    if (!uploadRes.ok) throw new Error("Upload failed");

    return publicUrl as string;
}
