import { useNavigation } from "@react-navigation/native";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import EventCard from "../../components/EventCard";
import EventHeader from "./eventheader";
import { useEventLogic } from "./eventlogic";

export default function EventScreen() {
    const navigation = useNavigation<any>();

    const {
        events,
        loading,
        error,
        likedIds,
        savedIds,
        handleLike,
        handlePreSave,
        handleGetTicket,
    } = useEventLogic();

    if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#60A5FA" />;
    if (error) return <Text style={styles.error}>{error}</Text>;

    return (
        <View style={styles.container}>
            <EventHeader onCreateEvent={() => navigation.navigate("CreateEvent")} />
            <FlatList
                data={events}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <EventCard
                        event={item}
                        liked={likedIds.has(item.id)}
                        saved={savedIds.has(item.id)}
                        onLike={() => handleLike(item.id)}
                        onPreSave={() => handlePreSave(item.id)}
                        onGetTicket={() => handleGetTicket(item.id)}
                    />
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F172A" },
    error: { color: "#F87171", textAlign: "center", marginTop: 40 },
});
