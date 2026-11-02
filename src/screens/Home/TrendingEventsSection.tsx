import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";
import { Event } from "../../hooks/useEvents";
import EventCard from "../../components/EventCard";

type Props = {
    events: Event[];
    likedIds: Set<string>;
    savedIds: Set<string>;
    onLike: (eventId: string) => void;
    onPreSave: (eventId: string) => void;
    onGetTicket: (eventId: string) => void;
    previewCount?: number;
};

export default function TrendingEventsSection({ events, likedIds, savedIds, onLike, onPreSave, onGetTicket, previewCount = 5 }: Props) {
    const C = getColors(useAppTheme().theme);

    const trending = useMemo(
        () => [...events].sort((a, b) => b.recent_likes_count - a.recent_likes_count).slice(0, previewCount),
        [events, previewCount]
    );

    if (!trending.length) return null;

    return (
        <View style={styles.section}>
            <Text style={[styles.title, { color: C.text }]}>Trending</Text>
            {trending.map((e) => (
                <EventCard
                    key={e.id}
                    event={e}
                    liked={likedIds.has(e.id)}
                    saved={savedIds.has(e.id)}
                    onLike={() => onLike(e.id)}
                    onPreSave={() => onPreSave(e.id)}
                    onGetTicket={() => onGetTicket(e.id)}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    section: { marginBottom: 20 },
    title: { fontSize: 17, fontWeight: "800", marginBottom: 12, marginLeft: 16 },
});
