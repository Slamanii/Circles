import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import EventCard from "../../components/EventCard";
import { useEventFilter, EventFilter } from "../../hooks/useEventFilter";
import { useEventLogic } from "../Event/eventlogic";
import HomeHeader from "./homeheader";
import { useHomeLogic } from "./homelogic";

const FILTERS: { key: EventFilter; label: string }[] = [
    { key: "forYou", label: "For You" },
    { key: "date",   label: "Date" },
    { key: "price",  label: "Price" },
    { key: "location", label: "Location" },
];

export default function HomeScreen() {

    const {
        events,
        loading,
        likedIds,
        savedIds,
        handleLike,
    } = useEventLogic();

    const {
        error,
        address,
        username,
        stories,
        handlePreSave,
        handleGetTicket,
        onPresavePress,
        onChatPress,
        onStoryPress,
        onEventPress,
    } = useHomeLogic();

    const { filtered, activeFilter, setActiveFilter } = useEventFilter(events, address);

    if (loading) return <ActivityIndicator />;
    if (error) return <Text>{error}</Text>;

    return (
        <View style={styles.container}>
            <HomeHeader username={username} />

            <View style={styles.card}>
                <Text style={styles.address}>{address}</Text>
            </View>

            <FlatList
                data={FILTERS}
                horizontal
                keyExtractor={(item) => item.key}
                showsHorizontalScrollIndicator={false}
                style={styles.filterRow}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => setActiveFilter(item.key)}
                        style={[
                            styles.filterChip,
                            activeFilter === item.key && styles.filterChipActive,
                        ]}
                    >
                        <Text style={[
                            styles.filterText,
                            activeFilter === item.key && styles.filterTextActive,
                        ]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.button} onPress={onPresavePress}>
                    <Text style={styles.buttonText}>Presave</Text>
                </TouchableOpacity>

                <FlatList
                    data={stories}
                    horizontal
                    keyExtractor={(item) => item.storyId}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => onStoryPress(item.storyId)}>
                            <Image source={{ uri: item.profilePic }} style={{ width: 60, height: 60, borderRadius: 30 }} />
                        </TouchableOpacity>
                    )}
                />

                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => onEventPress(item.id)}>
                            <EventCard
                                event={item}
                                liked={likedIds.has(item.id)}
                                saved={savedIds.has(item.id)}
                                onLike={() => handleLike(item.id)}
                                onPreSave={() => handlePreSave(item.id)}
                                onGetTicket={() => handleGetTicket(item.id)}
                            />
                        </TouchableOpacity>
                    )}
                />

                <TouchableOpacity style={styles.button} onPress={onChatPress}>
                    <Text style={styles.buttonText}>Chat</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F172A",
        padding: 20,
    },
    card: {
        backgroundColor: "#1E293B",
        borderRadius: 16,
        padding: 20,
        marginTop: 10,
    },
    address: {
        color: "white",
        fontSize: 26,
        fontWeight: "bold",
        marginTop: 5,
    },
    filterRow: {
        marginTop: 16,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#E2E8F0",
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: "#2563EB",
    },
    filterText: {
        fontSize: 14,
        color: "#1E293B",
        fontWeight: "500",
    },
    filterTextActive: {
        color: "white",
    },
    button: {
        backgroundColor: "#2563EB",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    buttonRow: {
        marginTop: 20,
        gap: 15,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
})
