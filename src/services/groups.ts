import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function authHeaders() {
    const token = await AsyncStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function createGroupChat(creatorId: string, groupName: string, eventId: string) {
    try {
        const res = await fetch(`${API_URL}/api/create-group`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({ creatorId, groupName, eventId }),
        });
        if (!res.ok) throw new Error("Failed to create group chat");
        return await res.json();
    } catch (err) {
        console.error("createGroupChat error:", err);
    }
}

export async function getGroup(groupId: string) {
    try {
        const res = await fetch(`${API_URL}/api/get-group`, {
            method: "GET",
            headers: await authHeaders(),
            body: JSON.stringify({ groupId }),
        });
        if (!res.ok) throw new Error("Failed to get group chat");
        return await res.json();
    } catch (err) {
        console.error("getGroup error:", err);
    }
}

export async function sendMessage(MessageData: any) {
    try {
        const res = await fetch(`${API_URL}/api/send-message`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify(MessageData),
        });
        if (!res.ok) throw new Error("Failed to send message");
        return await res.json();
    } catch (err) {
        console.error("sendMessage error:", err);
    }
}

export async function removeMember(memberData: any) {
    try {
        const res = await fetch(`${API_URL}/api/remove-member`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify(memberData),
        });
        if (!res.ok) throw new Error("Failed to remove member");
        return await res.json();
    } catch (err) {
        console.error("removeMember error:", err);
    }
}

export async function fetchMessages(messageData: any) {
    try {
        const res = await fetch(`${API_URL}/api/fetch-messages`, {
            method: "GET",
            headers: await authHeaders(),
            body: JSON.stringify(messageData),
        });
        if (!res.ok) throw new Error("Failed to fetch messages");
        return await res.json();
    } catch (err) {
        console.error("fetchMessages error:", err);
    }
}

export async function leaveGroup(leaveData: any) {
    try {
        const res = await fetch(`${API_URL}/api/leave-group`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify(leaveData),
        });
        if (!res.ok) throw new Error("Failed to leave group");
        return await res.json();
    } catch (err) {
        console.error("leaveGroup error:", err);
    }
}

export async function deleteGroup(deleteData: any) {
    try {
        const res = await fetch(`${API_URL}/api/delete-group`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify(deleteData),
        });
        if (!res.ok) throw new Error("Failed to delete group");
        return await res.json();
    } catch (err) {
        console.error("deleteGroup error:", err);
    }
}

export async function makeAdmin(adminData: any) {
    try {
        const res = await fetch(`${API_URL}/api/make-admin`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify(adminData),
        });
        if (!res.ok) throw new Error("Failed to make admin");
        return await res.json();
    } catch (err) {
        console.error("makeAdmin error:", err);
    }
}

export async function fetchUnreadNotifications() {
    try {
        const res = await fetch(`${API_URL}/api/fetch-unread-notifications`, {
            method: "GET",
            headers: await authHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch unread notifications");
        return await res.json();
    } catch (err) {
        console.error("fetchUnreadNotifications error:", err);
    }
}

export async function markNotificationsRead() {
    try {
        const res = await fetch(`${API_URL}/api/mark-notification-read`, {
            method: "POST",
            headers: await authHeaders(),
        });
        if (!res.ok) throw new Error("Failed to mark notifications as read");
        return await res.json();
    } catch (err) {
        console.error("markNotificationsRead error:", err);
    }
}

export async function getUnreadCount(messageData: any) {
    try {
        const res = await fetch(`${API_URL}/api/get-unreadcount`, {
            method: "GET",
            headers: await authHeaders(),
            body: JSON.stringify(messageData),
        });
        if (!res.ok) throw new Error("Failed to get unread count");
        return await res.json();
    } catch (err) {
        console.error("getUnreadCount error:", err);
    }
}

export async function markAsRead(messageData: any) {
    try {
        const res = await fetch(`${API_URL}/api/mark-asread`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify(messageData),
        });
        if (!res.ok) throw new Error("Failed to mark as read");
        return await res.json();
    } catch (err) {
        console.error("markAsRead error:", err);
    }
}
