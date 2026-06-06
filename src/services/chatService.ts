import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function authHeaders() {
    const token = await AsyncStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function getGroup(groupId: string) {
    const res = await fetch(`${API_URL}/api/get-group`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ groupId }),
    });
    if (!res.ok) throw new Error("Failed to fetch group");
    return await res.json();
}

export async function removeMember(groupId: string, userId: string) {
    const res = await fetch(`${API_URL}/api/remove-member`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ groupId, userId }),
    });
    if (!res.ok) throw new Error("Failed to remove member");
    return await res.json();
}

export async function makeAdmin(groupId: string, targetUserId: string, currentUserId: string) {
    const res = await fetch(`${API_URL}/api/make-admin`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ groupId, targetUserId, currentUserId }),
    });
    if (!res.ok) throw new Error("Failed to make admin");
    return await res.json();
}

export async function fetchUserGroups() {
    const res = await fetch(`${API_URL}/api/fetch-user-groups`, {
        headers: await authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch groups");
    return await res.json();
}

export async function fetchMessages(groupId: string, limit = 50) {
    const res = await fetch(`${API_URL}/api/fetch-messages`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ groupId, limit }),
    });
    if (!res.ok) throw new Error("Failed to fetch messages");
    return await res.json();
}

export async function pinMessage(messageId: string, groupId: string) {
    const res = await fetch(`${API_URL}/api/pin-message`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ messageId, groupId }),
    });
    if (!res.ok) throw new Error("Failed to pin message");
    return await res.json();
}

export async function deleteMessage(messageId: string, deleteFor: "me" | "everyone") {
    const res = await fetch(`${API_URL}/api/delete-message`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ messageId, deleteFor }),
    });
    if (!res.ok) throw new Error("Failed to delete message");
    return await res.json();
}

export async function sendMessage(
    groupId: string,
    content: string,
    type: "text" | "image" | "video" | "audio" = "text",
    media?: { uri: string; thumbnail?: string; duration?: number },
    replyTo?: string,
) {
    const res = await fetch(`${API_URL}/api/send-message`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ groupId, content, type, media, replyTo }),
    });
    if (!res.ok) throw new Error("Failed to send message");
    return await res.json();
}

export async function starMessage(messageId: string) {
    const res = await fetch(`${API_URL}/api/star-message`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ messageId }),
    });
    if (!res.ok) throw new Error("Failed to star message");
    return res.json();
}

export async function unstarMessage(messageId: string) {
    const res = await fetch(`${API_URL}/api/unstar-message`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ messageId }),
    });
    if (!res.ok) throw new Error("Failed to unstar message");
    return res.json();
}

export async function fetchStarredIds(groupId: string): Promise<string[]> {
    const res = await fetch(`${API_URL}/api/starred-messages?groupId=${groupId}`, {
        headers: await authHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.ids ?? [];
}
