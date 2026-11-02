import { api } from "./apiClient";
import { uploadMedia } from "./upload";

export async function fetchEvents(limit: number = 50, offset: number = 0) {
    return api.get(`/api/fetch-events?limit=${limit}&offset=${offset}`, "Failed to fetch events");
}

// Falls back here when an event isn't in the bulk browse list — the case for
// a private event, which is deliberately excluded from fetch-events and only
// reachable via its invite link/token.
export async function getEventById(eventId: string, token?: string) {
    const query = token ? `?token=${encodeURIComponent(token)}` : "";
    return api.get(`/api/event/${eventId}${query}`, "Failed to fetch event");
}

export async function uploadFlyer(uri: string): Promise<string> {
    return uploadMedia(uri, "event-flyers", "flyer.jpg", "image/jpeg");
}

export async function uploadEventVideo(uri: string): Promise<string> {
    return uploadMedia(uri, "event-video", "video.mp4", "video/mp4");
}

export async function editEvent(eventId: string, patch: { eventDate?: string; venue?: string; guestList?: string }) {
    return api.put(`/api/event/${eventId}`, patch, "Failed to update event");
}

export async function addCollaborator(eventId: string, userId: string) {
    return api.post(`/api/event/${eventId}/collaborators`, { userId }, "Failed to add collaborator");
}

export async function removeCollaborator(eventId: string, userId: string) {
    return api.post(`/api/event/${eventId}/collaborators/remove`, { userId }, "Failed to remove collaborator");
}

export async function cancelEvent(eventId: string, notice: string) {
    return api.post(`/api/event/${eventId}/cancel`, { notice }, "Failed to cancel event");
}

export async function grantScanAccess(eventId: string, userId: string) {
    return api.post(`/api/event/${eventId}/scan-grants`, { userId }, "Failed to grant scan access");
}

export async function revokeScanAccess(eventId: string, userId: string) {
    return api.post(`/api/event/${eventId}/scan-grants/remove`, { userId }, "Failed to revoke scan access");
}

export async function fetchScanGrants(eventId: string) {
    return api.get(`/api/event/${eventId}/scan-grants`, "Failed to fetch scan grants");
}

export async function fetchScannableEvents() {
    return api.get("/api/scannable-events", "Failed to fetch scannable events");
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
