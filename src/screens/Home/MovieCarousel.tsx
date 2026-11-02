import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";
import { isLightColor, useDominantColor } from "../../hooks/useDominantColor";
import { Event } from "../../hooks/useEvents";

function MovieCard({ event, onPress, cardBg }: { event: Event; onPress: () => void; cardBg: string }) {
    const flyers = event.flyer_card ?? [];
    const [flyerIndex, setFlyerIndex] = useState(0);
    // Background is derived once from the first flyer and held fixed — only
    // the foreground image cycles, so the card doesn't flicker every 5s.
    const bgColor = useDominantColor(flyers[0], cardBg);
    const textColor = isLightColor(bgColor) ? "#111111" : "#FFFFFF";

    useEffect(() => {
        if (flyers.length <= 1) return;
        const id = setInterval(() => setFlyerIndex(i => (i + 1) % flyers.length), 5000);
        return () => clearInterval(id);
    }, [flyers.length]);

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.card, { backgroundColor: bgColor }]}>
            <View style={styles.textBlock}>
                <Text style={[styles.title, { color: textColor }]} numberOfLines={2}>{event.title}</Text>
                <Text style={[styles.venue, { color: textColor, opacity: 0.75 }]} numberOfLines={1}>{event.venue}</Text>
            </View>
            {flyers[flyerIndex] ? (
                <Image source={{ uri: flyers[flyerIndex] }} style={styles.flyer} contentFit="cover" />
            ) : null}
        </TouchableOpacity>
    );
}

export default function MovieCarousel({ events, onPressEvent }: { events: Event[]; onPressEvent: (eventId: string) => void }) {
    const C = getColors(useAppTheme().theme);
    const movies = events.filter(e => e.category === "movie");
    if (!movies.length) return null;

    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Movies</Text>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={movies}
                keyExtractor={(e) => e.id}
                contentContainerStyle={styles.row}
                renderItem={({ item }) => (
                    <MovieCard event={item} cardBg={C.card} onPress={() => onPressEvent(item.id)} />
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 17, fontWeight: "800", marginBottom: 12, marginLeft: 16 },
    row: { paddingHorizontal: 16, gap: 14 },
    card: {
        width: 280,
        height: 160,
        borderRadius: 24,
        overflow: "hidden",
        padding: 18,
        justifyContent: "flex-start",
    },
    textBlock: { maxWidth: "62%", gap: 4 },
    title: { fontSize: 18, fontWeight: "800" },
    venue: { fontSize: 12, fontWeight: "600" },
    flyer: {
        position: "absolute",
        bottom: -14,
        right: -14,
        width: 150,
        height: 180,
        borderRadius: 18,
    },
});
