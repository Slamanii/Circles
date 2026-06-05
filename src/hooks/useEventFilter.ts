import { useMemo, useState } from "react";
import { Event } from "./useEvents";

export type DateRange  = { from: Date | null; to: Date | null };
export type PriceRange = { min: number | null; max: number | null };

export function useEventFilter(events: Event[], userLocation: string) {
    const [dateRange,        setDateRange]        = useState<DateRange>({ from: null, to: null });
    const [priceRange,       setPriceRange]       = useState<PriceRange>({ min: null, max: null });
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

    const uniqueLocations = useMemo(
        () => [...new Set(events.map(e => e.venue).filter(Boolean))].sort(),
        [events],
    );

    const filtered = useMemo(() => {
        const now = Date.now();
        let result = [...events];

        if (dateRange.from || dateRange.to) {
            result = result.filter(e => {
                const d = new Date(e.event_date).getTime();
                if (dateRange.from) {
                    const start = new Date(dateRange.from); start.setHours(0, 0, 0, 0);
                    if (d < start.getTime()) return false;
                }
                if (dateRange.to) {
                    const end = new Date(dateRange.to); end.setHours(23, 59, 59, 999);
                    if (d > end.getTime()) return false;
                }
                return true;
            });
        }

        if (priceRange.min !== null || priceRange.max !== null) {
            result = result.filter(e => {
                if (priceRange.min !== null && e.ticket_price < priceRange.min) return false;
                if (priceRange.max !== null && e.ticket_price > priceRange.max) return false;
                return true;
            });
        }

        if (selectedLocation) {
            result = result.filter(e =>
                e.venue.toLowerCase() === selectedLocation.toLowerCase()
            );
        }

        // default sort: soonest upcoming first, past events at the end
        result.sort((a, b) => {
            const da = new Date(a.event_date).getTime();
            const db = new Date(b.event_date).getTime();
            const aUp = da >= now, bUp = db >= now;
            if (aUp && !bUp) return -1;
            if (!aUp && bUp)  return  1;
            return aUp ? da - db : db - da;
        });

        return result;
    }, [events, dateRange, priceRange, selectedLocation, userLocation]);

    const clearAdvanced = () => {
        setDateRange({ from: null, to: null });
        setPriceRange({ min: null, max: null });
        setSelectedLocation(null);
    };

    return {
        filtered,
        uniqueLocations,
        dateRange,        setDateRange,
        priceRange,       setPriceRange,
        selectedLocation, setSelectedLocation,
        hasDateFilter:     !!(dateRange.from || dateRange.to),
        hasPriceFilter:    priceRange.min !== null || priceRange.max !== null,
        hasLocationFilter: !!selectedLocation,
        clearAdvanced,
    };
}
