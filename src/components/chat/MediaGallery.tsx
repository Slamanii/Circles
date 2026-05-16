import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type MediaItem = {
    id: string;
    type: "image" | "video";
    uri: string;
    thumbnail?: string;
};

type Props = {
    items: MediaItem[];
    onPress: (item: MediaItem) => void;
};

export function MediaGallery({ items, onPress }: Props) {

    if (!items.length) {
        return <Text style={styles.empty}>No media shared yet</Text>;
    }

    return (
        <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            renderItem={({ item }) => (
                <TouchableOpacity style={styles.cell} onPress={() => onPress(item)}>
                    <Image
                        source={{ uri: item.thumbnail ?? item.uri }}
                        style={styles.thumb}
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
    empty: {
        color: "#64748B",
        fontSize: 13,
        textAlign: "center",
        marginVertical: 20,
    },
    cell: {
        flex: 1,
        aspectRatio: 1,
        margin: 1,
    },
    thumb: {
        width: "100%",
        height: "100%",
        backgroundColor: "#1E293B",
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
    },
    playIcon: {
        color: "white",
        fontSize: 24,
    },
});
