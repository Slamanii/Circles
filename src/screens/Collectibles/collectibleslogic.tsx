import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Collectible, fetchCollectibles } from "../../services/collectiblesService";
import { AppNotification } from "../../services/notifications";
import { getSocket } from "../../services/socket";

export default function useCollectiblesLogic() {
    const navigation = useNavigation<any>();
    const [collectibles, setCollectibles] = useState<Collectible[]>([]);
    const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);

    async function load() {
        try {
            const [data, stored] = await Promise.all([
                fetchCollectibles(),
                AsyncStorage.getItem("pinnedTickets"),
            ]);
            setCollectibles(data);
            if (stored) setPinnedIds(new Set(JSON.parse(stored)));
        } catch (err) {
            console.error("Failed to load collectibles", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    const reload = async () => { await load(); };

    // A ticket transfer or purchase claim can land while this screen is open
    // (or backgrounded) — refresh instead of requiring a manual pull-to-refresh.
    useEffect(() => {
        const s = getSocket();
        const handler = (n: AppNotification) => {
            if (n.type === "collectible_received" || n.type === "collectible_purchase_confirmed") load();
        };
        s?.on("notification", handler);
        return () => { s?.off("notification", handler); };
    }, []);

    useEffect(() => {
        AsyncStorage.setItem("pinnedTickets", JSON.stringify(Array.from(pinnedIds)));
    }, [pinnedIds]);

    const isPinned = useCallback((id: string) => pinnedIds.has(id), [pinnedIds]);

    const sortByPin = useCallback(
    (a: Collectible, b: Collectible) =>
        Number(pinnedIds.has(b.id)) - Number(pinnedIds.has(a.id)),
    [pinnedIds]
);

    const activeTickets = useMemo(
        () => collectibles.filter((c) => c.status === "active").sort(sortByPin),
        [collectibles, sortByPin]
    );

    const previousTickets = useMemo(
        () => collectibles.filter((c) => c.status !== "active").sort(sortByPin),
        [collectibles, sortByPin]
    );

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        return collectibles.filter(
            (c) =>
                c.events?.title.toLowerCase().includes(q) ||
                c.events?.venue.toLowerCase().includes(q)
        );
    }, [query, collectibles]);

    return {
        navigation,
        collectibles,
        activeTickets,
        previousTickets,
        loading,
        query,
        setQuery,
        results,
        isPinned,
        reload,
    };
}
