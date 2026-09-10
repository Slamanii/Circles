import { RawGroup, RawGroupMember, RawMessage, UserGroupEntry } from "../../shared/Types";
import { api } from "./apiClient";

export async function getGroup(groupId: string) {
    return api.post<{ group: RawGroup; member: { id: string } }>(
        "/api/get-group", { groupId }, "Failed to fetch group"
    );
}

export async function removeMember(groupId: string, userId: string) {
    return api.post<{ success: boolean }>("/api/remove-member", { groupId, userId }, "Failed to remove member");
}

export async function makeAdmin(groupId: string, targetUserId: string, currentUserId: string) {
    return api.post<{ success: boolean }>(
        "/api/make-admin", { groupId, targetUserId, currentUserId }, "Failed to make admin"
    );
}

export async function fetchUserGroups() {
    return api.get<UserGroupEntry[]>("/api/fetch-user-groups", "Failed to fetch groups");
}

export async function leaveGroup(groupId: string) {
    return api.post<{ success: boolean }>("/api/leave-group", { groupId }, "Failed to leave group");
}

export async function deleteGroup(groupId: string) {
    return api.post<{ success: boolean }>("/api/delete-group", { groupId }, "Failed to delete group");
}

export async function getUnreadCount(groupId: string): Promise<number> {
    try {
        return await api.get<number>(`/api/get-unreadcount?groupId=${groupId}`, "Failed to get unread count");
    } catch {
        return 0;
    }
}

export async function markAsRead(groupId: string) {
    return api.post<boolean>("/api/mark-asread", { groupId }, "Failed to mark as read");
}

export async function fetchMessages(groupId: string, limit = 50) {
    return api.post<{ messages: RawMessage[] }>("/api/fetch-messages", { groupId, limit }, "Failed to fetch messages");
}

export async function pinMessage(messageId: string, groupId: string) {
    return api.post<{ pinned: boolean }>("/api/pin-message", { messageId, groupId }, "Failed to pin message");
}

export async function deleteMessage(messageId: string, deleteFor: "me" | "everyone") {
    return api.post<{ deleted: "me" | "everyone" }>(
        "/api/delete-message", { messageId, deleteFor }, "Failed to delete message"
    );
}

export async function sendMessage(
    groupId: string,
    content: string,
    type: "text" | "image" | "video" | "audio" = "text",
    media?: { uri: string; thumbnail?: string; duration?: number },
    replyTo?: string,
) {
    return api.post<RawMessage>(
        "/api/send-message", { groupId, content, type, media, replyTo }, "Failed to send message"
    );
}

export async function starMessage(messageId: string) {
    return api.post<{ starred: true; id: string }>("/api/star-message", { messageId }, "Failed to star message");
}

export async function unstarMessage(messageId: string) {
    return api.post<{ starred: false }>("/api/unstar-message", { messageId }, "Failed to unstar message");
}

export async function fetchStarredIds(groupId: string): Promise<string[]> {
    try {
        const data = await api.get<{ ids: string[] }>(`/api/starred-messages?groupId=${groupId}`);
        return data.ids ?? [];
    } catch {
        return [];
    }
}

export type { RawGroup, RawGroupMember, RawMessage };
