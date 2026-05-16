import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function authHeaders() {
    const token = await AsyncStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function searchUsers(query: string) {
    const res = await fetch(`${API_URL}/api/search-users?q=${encodeURIComponent(query)}`, {
        headers: await authHeaders(),
    });
    if (!res.ok) throw new Error("Search failed");
    return await res.json();
}

export async function getUser() {
    const res = await fetch(`${API_URL}/api/get-user`, {
        headers: await authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    return await res.json();
}

export async function fetchFollowers() {
    try {
        const res = await fetch(`${API_URL}/api/fetch-followers`, {
            method: "POST",
            headers: await authHeaders(),
        });
        if (!res.ok) throw new Error("Failed to load followers");
        return await res.json();
    } catch (err) {
        console.error("fetchFollowers error:", err);
    }
}

export async function fetchFollowing() {
    try {
        const res = await fetch(`${API_URL}/api/fetch-following`, {
            method: "POST",
            headers: await authHeaders(),
        });
        if (!res.ok) throw new Error("Failed to load following");
        return await res.json();
    } catch (err) {
        console.error("fetchFollowing error:", err);
    }
}

export async function fetchHostedEvents() {
    try {
        const res = await fetch(`${API_URL}/api/fetch-hosted-events`, {
            method: "POST",
            headers: await authHeaders(),
        });
        if (!res.ok) throw new Error("Failed to load hosted events");
        return await res.json();
    } catch (err) {
        console.error("fetchHostedEvents error:", err);
    }
}

export async function fetchEventLikes(eventId: string) {
    try {
        const res = await fetch(`${API_URL}/api/fetch-event-likes`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({ eventId }),
        });
        if (!res.ok) throw new Error("Failed to load event likes");
        return await res.json();
    } catch (err) {
        console.error("fetchEventLikes error:", err);
    }
}

export async function followUser(followingData: string) {
    try {
        const res = await fetch(`${API_URL}/api/follow-user`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify(followingData),
        });
        if (!res.ok) throw new Error("Failed to follow user");
        return await res.json();
    } catch (err) {
        console.error("followUser error:", err);
    }
}
