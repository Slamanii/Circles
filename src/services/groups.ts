import { api } from "./apiClient";

export async function createGroupChat(creatorId: string, groupName: string, eventId: string) {
    try {
        return await api.post("/api/create-group", { creatorId, groupName, eventId }, "Failed to create group chat");
    } catch (err) {
        console.error("createGroupChat error:", err);
    }
}

export async function getGroup(groupId: string) {
    try {
        return await api.get(`/api/get-group?groupId=${groupId}`, "Failed to get group chat");
    } catch (err) {
        console.error("getGroup error:", err);
    }
}

export async function sendMessage(MessageData: any) {
    try {
        return await api.post("/api/send-message", MessageData, "Failed to send message");
    } catch (err) {
        console.error("sendMessage error:", err);
    }
}

export async function removeMember(memberData: any) {
    try {
        return await api.post("/api/remove-member", memberData, "Failed to remove member");
    } catch (err) {
        console.error("removeMember error:", err);
    }
}

export async function fetchMessages(messageData: any) {
    try {
        return await api.get("/api/fetch-messages", "Failed to fetch messages");
    } catch (err) {
        console.error("fetchMessages error:", err);
    }
}

export async function leaveGroup(leaveData: any) {
    try {
        return await api.post("/api/leave-group", leaveData, "Failed to leave group");
    } catch (err) {
        console.error("leaveGroup error:", err);
    }
}

export async function deleteGroup(deleteData: any) {
    try {
        return await api.post("/api/delete-group", deleteData, "Failed to delete group");
    } catch (err) {
        console.error("deleteGroup error:", err);
    }
}

export async function makeAdmin(adminData: any) {
    try {
        return await api.post("/api/make-admin", adminData, "Failed to make admin");
    } catch (err) {
        console.error("makeAdmin error:", err);
    }
}

export async function fetchUnreadNotifications() {
    try {
        return await api.get("/api/fetch-unread-notifications", "Failed to fetch unread notifications");
    } catch (err) {
        console.error("fetchUnreadNotifications error:", err);
    }
}

export async function markNotificationsRead() {
    try {
        return await api.post("/api/mark-notification-read", undefined, "Failed to mark notifications as read");
    } catch (err) {
        console.error("markNotificationsRead error:", err);
    }
}

export async function getUnreadCount(messageData: any) {
    try {
        return await api.get("/api/get-unreadcount", "Failed to get unread count");
    } catch (err) {
        console.error("getUnreadCount error:", err);
    }
}

export async function markAsRead(messageData: any) {
    try {
        return await api.post("/api/mark-asread", messageData, "Failed to mark as read");
    } catch (err) {
        console.error("markAsRead error:", err);
    }
}
