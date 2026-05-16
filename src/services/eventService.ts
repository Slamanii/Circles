import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function authHeaders() {
    const token = await AsyncStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

export async function fetchEvents(limit: number = 50, offset: number = 0) {
    const headers = await authHeaders();
    const res = await fetch(`${API_URL}/api/fetch-events?limit=${limit}&offset=${offset}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch events");
    return await res.json();
}

export async function createEvent(eventData: any) {
    try {
        const res = await fetch(`${API_URL}/api/create-event`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify(eventData),
        });
        if (!res.ok) throw new Error("Failed to create event");
        return await res.json();
    } catch (err) {
        console.error("createEvent error:", err);
    }
}

export async function LikeEvent(eventId: string) {
    try {
        const res = await fetch(`${API_URL}/api/like-event`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({ eventId }),
        });
        if (!res.ok) throw new Error("Failed to like event");
        return await res.json();
    } catch (err) {
        console.error("likeEvent error:", err);
    }
}

export async function PreOrder(eventId: string) {
    try {
        const res = await fetch(`${API_URL}/api/initiate-wallet-tx`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({ eventId }),
        });
        if (!res.ok) throw new Error("Failed to preorder");
        return await res.json();
    } catch (err) {
        console.error("PreOrder error:", err);
    }
}

export async function PreSave(eventId: string) {
    try {
        const res = await fetch(`${API_URL}/api/presave-event`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({ eventId }),
        });
        if (!res.ok) throw new Error("Failed to presave event");
        return await res.json();
    } catch (err) {
        console.error("PreSave error:", err);
    }
}

export async function mintTickets(eventId: string, supply: number, creatorId: string) {
    try {
        const res = await fetch(`${API_URL}/api/mint-tickets`, {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({ eventId, supply, creatorId }),
        });
        if (!res.ok) throw new Error("Failed to mint tickets");
        return await res.json();
    } catch (err) {
        console.error("mintTickets error:", err);
    }
}


