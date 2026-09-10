import { api } from "./apiClient";
import { uploadMedia } from "./upload";

export async function fetchEvents(limit: number = 50, offset: number = 0) {
    return api.get(`/api/fetch-events?limit=${limit}&offset=${offset}`, "Failed to fetch events");
}

export async function uploadFlyer(uri: string): Promise<string> {
    return uploadMedia(uri, "event-flyers", "flyer.jpg", "image/jpeg");
}

export async function createEvent(eventData: any) {
    try {
        return await api.post("/api/create-event", eventData, "Failed to create event");
    } catch (err) {
        console.error("createEvent error:", err);
        throw err;
    }
}

export async function LikeEvent(eventId: string) {
    try {
        return await api.post("/api/like-event", { eventId }, "Failed to like event");
    } catch (err) {
        console.error("likeEvent error:", err);
        throw err;
    }
}

export async function PreOrder(eventId: string) {
    try {
        return await api.post("/api/initiate-wallet-tx", { eventId }, "Failed to preorder");
    } catch (err) {
        console.error("PreOrder error:", err);
        throw err;
    }
}

export async function PreSave(eventId: string) {
    try {
        return await api.post("/api/presave-event", { eventId }, "Failed to presave event");
    } catch (err) {
        console.error("PreSave error:", err);
        throw err;
    }
}

export async function mintTickets(eventId: string, supply: number, creatorId: string) {
    try {
        return await api.post("/api/mint-tickets", { eventId, supply, creatorId }, "Failed to mint tickets");
    } catch (err) {
        console.error("mintTickets error:", err);
        throw err;
    }
}
