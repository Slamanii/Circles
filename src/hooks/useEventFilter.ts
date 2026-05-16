import { useMemo, useState } from "react";
import { Event } from "./useEvents";

export type EventFilter = "forYou" | "date" | "price" | "location";

// "forYou" = soonest upcoming events first (closest to today)
// "date"   = ascending by event_date
// "price"  = ascending by ticket_price
// "location" = events whose venue matches the user's address (partial, case-insensitive), rest appended after

export function useEventFilter(events: Event[], userAddress: string) {
    const [activeFilter, setActiveFilter] = useState<EventFilter>("forYou");

    const filtered = useMemo(() => {
        const now = Date.now();
        const sorted = [...events];

        switch (activeFilter) {
            case "forYou":
                // upcoming first — soonest to now, past events at the end
                return sorted.sort((a, b) => {
                    const da = new Date(a.event_date).getTime();
                    const db = new Date(b.event_date).getTime();
                    const aUpcoming = da >= now;
                    const bUpcoming = db >= now;
                    if (aUpcoming && !bUpcoming) return -1;
                    if (!aUpcoming && bUpcoming) return 1;
                    return aUpcoming ? da - db : db - da;
                });

            case "date":
                return sorted.sort((a, b) =>
                    new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
                );

            case "price":
                return sorted.sort((a, b) => a.ticket_price - b.ticket_price);

            case "location": {
                // pull out the city/area token from the user's address for matching
                const token = userAddress.split(",")[0]?.trim().toLowerCase();
                if (!token) return sorted;
                const match = sorted.filter(e => e.venue.toLowerCase().includes(token));
                const rest = sorted.filter(e => !e.venue.toLowerCase().includes(token));
                return [...match, ...rest];
            }
        }
    }, [events, activeFilter, userAddress]);

    return { filtered, activeFilter, setActiveFilter };
}
