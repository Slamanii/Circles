import { ActivityIndicator, FlatList, SectionList, Text, TouchableOpacity, View } from "react-native";
import { Collectible } from "../../services/collectiblesService";
import CollectiblesHeader from "./collectiblesheader";
import useCollectiblesLogic from "./collectibleslogic";

export default function CollectiblesScreen() {
    const {
        navigation,
        activeTickets,
        previousTickets,
        loading,
        query,
        setQuery,
        results,
        isPinned,
    } = useCollectiblesLogic();

    const sections = [
        { title: "Active", data: activeTickets },
        { title: "Previous", data: previousTickets },
    ];

    const renderTicket = ({ item }: { item: Collectible }) => (
        <TouchableOpacity
            style={{ flex: 1, alignItems: "center", marginBottom: 16 }}
            onPress={() => navigation.navigate("TicketInfo", { ticket: item })}
        >
            <View
                style={{
                    width: 140,
                    height: 160,
                    backgroundColor: "#1E293B",
                    borderRadius: 12,
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: isPinned(item.id) ? 2 : 0,
                    borderColor: "#60A5FA",
                    padding: 8,
                }}
            >
                <Text style={{ color: "white", fontWeight: "600", textAlign: "center", marginBottom: 4 }}>
                    {item.events?.title ?? "Ticket"}
                </Text>
                <Text style={{ color: "#94A3B8", fontSize: 12, textAlign: "center" }}>
                    {item.events?.venue ?? ""}
                </Text>
                <Text style={{ color: "#64748B", fontSize: 11, marginTop: 4 }}>
                    {item.events?.event_date
                        ? new Date(item.events.event_date).toLocaleDateString()
                        : ""}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
                <CollectiblesHeader query={query} setQuery={setQuery} />
                <ActivityIndicator style={{ flex: 1 }} color="#60A5FA" />
            </View>
        );
    }

    // Search results view
    if (query.trim()) {
        return (
            <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
                <CollectiblesHeader query={query} setQuery={setQuery} />
                <FlatList
                    data={results}
                    numColumns={2}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTicket}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                    ListEmptyComponent={
                        <Text style={{ color: "#64748B", textAlign: "center", marginTop: 40 }}>
                            No results
                        </Text>
                    }
                />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
            <CollectiblesHeader query={query} setQuery={setQuery} />
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                renderSectionHeader={({ section }) =>
                    section.data.length > 0 ? (
                        <Text style={{ color: "#94A3B8", fontWeight: "600", paddingHorizontal: 16, paddingVertical: 8 }}>
                            {section.title}
                        </Text>
                    ) : null
                }
                renderItem={({ section, index }) => {
                    // Render rows of 2 only at even indices
                    if (index % 2 !== 0) return null;
                    const left = section.data[index];
                    const right = section.data[index + 1];
                    return (
                        <View style={{ flexDirection: "row", paddingHorizontal: 16 }}>
                            {renderTicket({ item: left })}
                            {right ? renderTicket({ item: right }) : <View style={{ flex: 1 }} />}
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <Text style={{ color: "#64748B", textAlign: "center", marginTop: 60 }}>
                        No tickets yet
                    </Text>
                }
                contentContainerStyle={{ paddingBottom: 40 }}
            />
        </View>
    );
}
