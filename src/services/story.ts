import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function authHeaders() {
    const token = await AsyncStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function createStory(storyData: {
    mediaFiles: { mediaUrl: string; type: "image" | "video"; caption?: string }[];
}) {
    try {
        const res = await fetch(`${API_URL}/api/create-story`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify(storyData),
        });
        if (!res.ok) throw new Error("Failed to create story");
        return await res.json();
    } catch (err) {
        console.error("createStory error:", err);
    }
}

export async function viewStory(storyData: any) {
    try {
        const res = await fetch(`${API_URL}/api/view-story`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify(storyData),
        });
        if (!res.ok) throw new Error("Failed to view story");
        return await res.json();
    } catch (err) {
        console.error("viewStory error:", err);
    }
}

export async function unlikeStory(storyData: any) {
    try {
        const res = await fetch(`${API_URL}/api/unlike-story`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify(storyData),
        });
        if (!res.ok) throw new Error("Failed to unlike story");
        return await res.json();
    } catch (err) {
        console.error("unlikeStory error:", err);
    }
}

export async function likeStory(storyData: any) {
    try {
        const res = await fetch(`${API_URL}/api/like-story`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify(storyData),
        });
        if (!res.ok) throw new Error("Failed to like story");
        return await res.json();
    } catch (err) {
        console.error("likeStory error:", err);
    }
}

export async function deleteSubStory(deleteStoryData: any) {
    try {
        const res = await fetch(`${API_URL}/api/delete-substory`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({ deleteStoryData }),
        });
        if (!res.ok) throw new Error("Failed to delete sub story");
        return await res.json();
    } catch (err) {
        console.error("deleteSubStory error:", err);
    }
}

export async function deleteStory(deleteStoryData: any) {
    try {
        const res = await fetch(`${API_URL}/api/delete-story`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({ deleteStoryData }),
        });
        if (!res.ok) throw new Error("Failed to delete story");
        return await res.json();
    } catch (err) {
        console.error("deleteStory error:", err);
    }
}

export async function fetchStories() {
    try {
        const res = await fetch(`${API_URL}/api/fetch-stories`, {
            method: "GET",
            headers: await authHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch stories");
        return await res.json();
    } catch (err) {
        console.error("fetchStories error:", err);
    }
}

export async function fetchStoriesPreview() {
    try {
        const res = await fetch(`${API_URL}/api/fetch-storiespreview`, {
            method: "GET",
            headers: await authHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch stories preview");
        return await res.json();
    } catch (err) {
        console.error("fetchStoriesPreview error:", err);
    }
}

export async function fetchStoryByUser() {
    try {
        const res = await fetch(`${API_URL}/api/fetch-stories-by-user`, {
            method: "GET",
            headers: await authHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch story by user");
        return await res.json();
    } catch (err) {
        console.error("fetchStoryByUser error:", err);
    }
}

export async function fetchDiscoverStories() {
    try {
        const res = await fetch(`${API_URL}/api/fetch-discover-stories`, {
            method: "GET",
            headers: await authHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch discover stories");
        return await res.json();
    } catch (err) {
        console.error("fetchDiscoverStories error:", err);
    }
}

export async function fetchStoryViews(subStoryId: string) {
    try {
        const res = await fetch(`${API_URL}/api/fetch-storyviews?subStoryId=${encodeURIComponent(subStoryId)}`, {
            method: "GET",
            headers: await authHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch story views");
        return await res.json();
    } catch (err) {
        console.error("fetchStoryViews error:", err);
    }
}

export async function fetchStoryLikes(subStoryId: string) {
    try {
        const res = await fetch(`${API_URL}/api/fetch-storylikes`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({ subStoryId }),
        });
        if (!res.ok) throw new Error("Failed to fetch story likes");
        return await res.json();
    } catch (err) {
        console.error("fetchStoryLikes error:", err);
    }
}
