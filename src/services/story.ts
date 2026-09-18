import { NormalizedStory, RawStory, RawStoryLike, RawStoryView } from "../../shared/Types";
import { api } from "./apiClient";

function normalizeStory(raw: RawStory | null | undefined): NormalizedStory | null | undefined {
    if (!raw) return raw;
    return {
        storyId: raw.id,
        userId: raw.user_id,
        userName: raw.users?.username,
        avatar: raw.users?.avatar,
        previewMediaSnapshot: raw.preview_media_snapshot,
        createdAt: raw.created_at,
        subStories: (raw.story_items ?? []).map((item) => ({
            subId: item.id,
            mediaUrl: item.media_url,
            caption: item.caption,
            mediaType: item.media_type,
            createdAt: item.created_at,
        })),
    };
}

export async function createStory(storyData: {
    mediaFiles: { mediaUrl: string; type: "image" | "video"; caption?: string }[];
}) {
    try {
        return await api.post("/api/create-story", storyData, "Failed to create story");
    } catch (err) {
        console.error("createStory error:", err);
        throw err;
    }
}

export async function viewStory(storyData: { storyItemId: string }) {
    try {
        return await api.post("/api/view-story", storyData, "Failed to view story");
    } catch (err) {
        console.error("viewStory error:", err);
        throw err;
    }
}

export async function unlikeStory(storyData: { storyItemId: string }) {
    try {
        return await api.post("/api/unlike-story", storyData, "Failed to unlike story");
    } catch (err) {
        console.error("unlikeStory error:", err);
        throw err;
    }
}

export async function likeStory(storyData: { storyItemId: string }) {
    try {
        return await api.post("/api/like-story", storyData, "Failed to like story");
    } catch (err) {
        console.error("likeStory error:", err);
        throw err;
    }
}

export async function deleteSubStory(deleteStoryData: string) {
    try {
        return await api.post("/api/delete-substory", { deleteStoryData }, "Failed to delete sub story");
    } catch (err) {
        console.error("deleteSubStory error:", err);
        throw err;
    }
}

export async function deleteStory(deleteStoryData: string) {
    try {
        return await api.post("/api/delete-story", { deleteStoryData }, "Failed to delete story");
    } catch (err) {
        console.error("deleteStory error:", err);
        throw err;
    }
}

function isNormalizedStory(s: NormalizedStory | null | undefined): s is NormalizedStory {
    return s != null;
}

export async function fetchStories() {
    try {
        const data = await api.get<RawStory[]>("/api/fetch-stories", "Failed to fetch stories");
        return (data ?? []).map(normalizeStory).filter(isNormalizedStory);
    } catch (err) {
        console.error("fetchStories error:", err);
        throw err;
    }
}

export async function fetchStoriesPreview() {
    try {
        const data = await api.get<RawStory[]>("/api/fetch-storiespreview", "Failed to fetch stories preview");
        return (data ?? []).map(normalizeStory).filter(isNormalizedStory);
    } catch (err) {
        console.error("fetchStoriesPreview error:", err);
        throw err;
    }
}

export async function fetchStoryByUser(userId?: string) {
    try {
        const url = userId
            ? `/api/fetch-stories-by-user?userId=${userId}`
            : `/api/fetch-stories-by-user`;
        const data = await api.get<RawStory[]>(url, "Failed to fetch story by user");
        return (data ?? []).map(normalizeStory).filter(isNormalizedStory);
    } catch (err) {
        console.error("fetchStoryByUser error:", err);
        throw err;
    }
}

export async function fetchStoryById(storyId: string) {
    try {
        const data = await api.get<RawStory>(
            `/api/fetch-story-by-id?storyId=${encodeURIComponent(storyId)}`,
            "Failed to fetch story",
        );
        return normalizeStory(data);
    } catch (err) {
        console.error("fetchStoryById error:", err);
        throw err;
    }
}

export async function fetchDiscoverStories() {
    try {
        const data = await api.get<RawStory[]>("/api/fetch-discover-stories", "Failed to fetch discover stories");
        return (data ?? []).map(normalizeStory).filter(isNormalizedStory);
    } catch (err) {
        console.error("fetchDiscoverStories error:", err);
        throw err;
    }
}

export async function fetchStoryViews(subStoryId: string) {
    try {
        return await api.get<RawStoryView[]>(
            `/api/fetch-storyviews?subStoryId=${encodeURIComponent(subStoryId)}`,
            "Failed to fetch story views",
        );
    } catch (err) {
        console.error("fetchStoryViews error:", err);
        throw err;
    }
}

export async function fetchStoryLikes(subStoryId: string) {
    try {
        return await api.post<RawStoryLike[]>("/api/fetch-storylikes", { subStoryId }, "Failed to fetch story likes");
    } catch (err) {
        console.error("fetchStoryLikes error:", err);
        throw err;
    }
}
