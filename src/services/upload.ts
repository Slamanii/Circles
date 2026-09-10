import { api } from "./apiClient";

type Bucket = "stories" | "avatars" | "event-flyers" | "chat";

export async function uploadMedia(
    localUri: string,
    bucket: Bucket,
    filename: string,
    contentType: string,
): Promise<string> {
    const { signedUrl, publicUrl } = await api.post<{ signedUrl: string; publicUrl: string }>(
        "/api/upload-url",
        { bucket, filename, contentType },
        "Failed to get upload URL",
    );

    const fileRes = await fetch(localUri);
    const blob = await fileRes.blob();
    const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: blob,
    });
    if (!uploadRes.ok) throw new Error("Upload failed");

    return publicUrl;
}
