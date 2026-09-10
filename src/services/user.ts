import { EventStats, RawEventSummary } from "../../shared/Types";
import { api } from "./apiClient";

export type UserSummary = { id: string; username: string; display_name?: string; avatar?: string | null; verified?: boolean };

type UserProfile = {
    id: string;
    username: string;
    display_name?: string;
    bio?: string | null;
    link_1?: string | null;
    link_2?: string | null;
    location?: string | null;
    avatar?: string | null;
    verified?: boolean;
    private?: boolean;
    followers?: number;
    following?: number;
    canViewContent: boolean;
};

export type FollowRow = {
    follower_id?: string;
    following_id?: string;
    users?: UserSummary | null;
    isFollowing: boolean;
};

export async function searchUsers(query: string) {
    return api.get<UserSummary[]>(`/api/search-users?q=${encodeURIComponent(query)}`, "Search failed");
}

export async function getUser() {
    return api.get<UserProfile>("/api/get-user", "Failed to fetch user");
}

export async function getUserProfile(id?: string) {
    const url = id
        ? `/api/get-user-profile?id=${encodeURIComponent(id)}`
        : `/api/get-user`;
    return api.get<UserProfile>(url, "Failed to fetch user profile");
}

export async function fetchFollowers(userId?: string, limit?: number, offset?: number) {
    try {
        return await api.post<FollowRow[]>("/api/fetch-followers", { userId, limit, offset }, "Failed to load followers");
    } catch (err) {
        console.error("fetchFollowers error:", err);
        throw err;
    }
}

export async function fetchFollowing(userId?: string, limit?: number, offset?: number) {
    try {
        return await api.post<FollowRow[]>("/api/fetch-following", { userId, limit, offset }, "Failed to load following");
    } catch (err) {
        console.error("fetchFollowing error:", err);
        throw err;
    }
}

export async function fetchEventStats(eventId: string) {
    try {
        return await api.get<EventStats>(`/api/event-stats?eventId=${encodeURIComponent(eventId)}`, "Failed to load event stats");
    } catch (err) {
        console.error("fetchEventStats error:", err);
        throw err;
    }
}

export async function fetchHostedEvents(userId?: string) {
    try {
        return await api.post<RawEventSummary[]>("/api/fetch-hosted-events", userId ? { userId } : undefined, "Failed to load hosted events");
    } catch (err) {
        console.error("fetchHostedEvents error:", err);
        throw err;
    }
}

export async function fetchLikedEvents() {
    try {
        return await api.get<RawEventSummary[]>("/api/fetch-liked-events", "Failed to load liked events");
    } catch (err) {
        console.error("fetchLikedEvents error:", err);
        throw err;
    }
}

export async function fetchEventLikes(eventId: string) {
    try {
        return await api.post<{ likedByUser: boolean; count: number }>(
            "/api/fetch-event-likes", { eventId }, "Failed to load event likes"
        );
    } catch (err) {
        console.error("fetchEventLikes error:", err);
        throw err;
    }
}

export async function updateProfile(data: {
    display_name?: string;
    bio?: string;
    link_1?: string;
    link_2?: string;
    location?: string;
    avatar?: string;
    private?: boolean;
}) {
    return api.put("/api/update-profile", data, "Failed to update profile");
}

export async function followUser(followingId: string) {
    try {
        return await api.post("/api/follow-user", { followingId }, "Failed to follow user");
    } catch (err) {
        console.error("followUser error:", err);
        throw err;
    }
}

export async function unfollowUser(followingId: string) {
    try {
        return await api.post("/api/unfollow-user", { followingId }, "Failed to unfollow user");
    } catch (err) {
        console.error("unfollowUser error:", err);
        throw err;
    }
}
