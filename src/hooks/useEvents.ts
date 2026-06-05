import { useEffect, useState } from "react";
import { fetchEvents } from "../services/eventService";

export type Event = {
    id: string;
    title: string;
    description: string;
    ticket_price: number;
    ticket_supply: number;
    event_date: string;   // ISO timestamp
    venue: string;
    creator_id: string;
    flyer_card: string | null;
    status: "active" | "expired" | "cancelled";
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
