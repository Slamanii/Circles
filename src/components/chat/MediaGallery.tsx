import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";

type MediaItem = { id: string; type: "image" | "video"; uri: string; thumbnail?: string };
type Props     = { items: MediaItem[]; onPress: (item: MediaItem) => void };

export function MediaGallery({ items, onPress }: Props) {
    const C = getColors(useAppTheme().theme);

    if (!items.length) return (
        <Text style={[styles.empty, { color: C.textMuted }]}>No media shared yet</Text>
    );

    return (
        <FlatList
            data={items}
            keyExtractor={item => item.id}
            numColumns={3}
            scrollEnabled={false}
            renderItem={({ item }) => (
                <TouchableOpacity style={styles.cell} onPress={() => onPress(item)}>
                    <Image
                        source={{ uri: item.thumbnail ?? item.uri }}
                        style={[styles.thumb, { backgroundColor: C.surface }]}
                        resizeMode="cover"
                    />
                    {item.type === "video" && (
                        <View style={styles.playOverlay}>
                            <Text style={styles.playIcon}>▶</Text>
                        </View>
                    )}
                </TouchableOpacity>
            )}
        />
    );
}

const styles = StyleSheet.create({
    empty:       { fontSize: 13, textAlign: "center", marginVertical: 20 },
    cell:        { flex: 1, aspectRatio: 1, margin: 1 },
    thumb:       { width: "100%", height: "100%" },
    playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.3)" },
    playIcon:    { color: "white", fontSize: 24 },
});
