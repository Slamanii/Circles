import { useEffect, useState } from "react";
import { fetchEvents } from "../services/eventService";

export type TicketTier = {
    id: string;
    name: string;
    price: number;
    supply: number;
    info: string | null;
    sort_order: number;
    remaining: number;
    group_ticket: number | null;
    free: boolean;
};

export type EventCategory = "movie" | "professional" | "concert" | "birthday" | "sports" | "educational" | "private" | "other";

export type Event = {
    id: string;
    title: string;
    description: string;
    ticket_price: number;
    ticket_supply: number;
    event_date: string;   // ISO timestamp
    venue: string;
    creator_id: string;
    flyer_card: string[] | null;
    status: "active" | "expired" | "cancelled";
    category: EventCategory;
    custom_category: string | null;
    guest_list: string | null;
    cancellation_notice: string | null;
    collaborators: { id: string; username: string; avatar: string | null }[];
    creator: { id: string; username: string; avatar: string | null } | null;
    recent_likes_count: number;
    video_url: string | null;
    ticket_tiers: TicketTier[];
};

export function useEvents() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function load() {
        try {
            const data = await fetchEvents();
            setEvents(data);
        } catch (err) {
            setError("Failed to load events");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    const reload = async () => {
        setError(null);
        await load();
    };

    return { events, loading, error, reload };
}
