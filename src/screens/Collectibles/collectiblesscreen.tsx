import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { Collectible } from "../../services/collectiblesService";
import { Colors, getColors, Radius, TAB_PAD } from "../../shared/theme";
import CollectiblesHeader from "./collectiblesheader";
import useCollectiblesLogic from "./collectibleslogic";

type CardProps = {
    item: Collectible;
    navigation: any;
    isPinned: (id: string) => boolean;
};

function TicketCard({ item, navigation, isPinned }: CardProps) {
    return (
        <TouchableOpacity
            style={[styles.ticketCard, isPinned(item.id) && styles.cardPinned]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("TicketInfo", { ticket: item })}
        >
            <View style={styles.cardInner}>
                {isPinned(item.id) && (
                    <Ionicons name="pin" size={12} color={Colors.accent} style={styles.pinIcon} />
                )}
            </View>
            <View style={styles.cardOverlay}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.events?.title ?? "Ticket"}
                </Text>
                {item.serial_number != null && (
                    <Text style={styles.cardSerial}>#{item.serial_number}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
}

function Grid({ data, navigation, isPinned }: { data: Collectible[]; navigation: any; isPinned: (id: string) => boolean }) {
    return (
        <FlatList
            data={data}
            numColumns={2}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            columnWrapperStyle={styles.row}
            renderItem={({ item }) => <TicketCard item={item} navigation={navigation} isPinned={isPinned} />}
        />
    );
}

export default function CollectiblesScreen() {
    const C = getColors(useAppTheme().theme);
    const [refreshing, setRefreshing] = useState(false);

    const {
        navigation,
        activeTickets,
        previousTickets,
        loading,
        query,
        setQuery,
        results,
        isPinned,
        reload,
    } = useCollectiblesLogic();

    const onRefresh = async () => {
        setRefreshing(true);
        await reload?.();
        setRefreshing(false);
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: C.background }]}>
                <CollectiblesHeader query={query} setQuery={setQuery} />
                <ActivityIndicator style={{ flex: 1 }} color={Colors.accent} />
            </View>
        );
    }

    if (query.trim()) {
        return (
            <View style={[styles.container, { backgroundColor: C.background }]}>
                <CollectiblesHeader query={query} setQuery={setQuery} />
                <FlatList
                    key="search"
                    data={results}
                    numColumns={2}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.row}
                    renderItem={({ item }) => <TicketCard item={item} navigation={navigation} isPinned={isPinned} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={[styles.emptyText, { color: C.textMuted }]}>No results for "{query}"</Text>
                        </View>
                    }
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: C.background }]}>
            <CollectiblesHeader query={query} setQuery={setQuery} />
            <FlatList
                key="main"
                data={[]}
                keyExtractor={() => "static"}
                renderItem={null}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.accent}
                        colors={[Colors.accent]}
                    />
                }
                ListHeaderComponent={
                    <>
                        {activeTickets.length > 0 && (
                            <View style={[styles.card, { backgroundColor: C.card }]}>
                                <View style={styles.sectionHeader}>
                                    <Text style={[styles.sectionTitle, { color: C.text }]}>New</Text>
                                    <Ionicons name="settings-outline" size={17} color={C.textSecondary} />
                                </View>
                                <Grid data={activeTickets} navigation={navigation} isPinned={isPinned} />
                            </View>
                        )}

                        {previousTickets.length > 0 && (
                            <View style={[styles.card, { backgroundColor: C.card }]}>
                                <View style={styles.sectionHeader}>
                                    <Text style={[styles.sectionTitle, { color: C.text }]}>Previous</Text>
                                </View>
                                <Grid data={previousTickets} navigation={navigation} isPinned={isPinned} />
                            </View>
                        )}

                        {activeTickets.length === 0 && previousTickets.length === 0 && (
                            <View style={styles.empty}>
                                <Ionicons name="ticket-outline" size={40} color={C.textMuted} />
                                <Text style={[styles.emptyText, { color: C.textMuted }]}>No tickets yet</Text>
                            </View>
                        )}
                    </>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: TAB_PAD,
    },
    card: {
        borderRadius: 20,
        padding: 14,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.text,
    },
    row: {
        gap: 12,
        marginBottom: 12,
    },
    ticketCard: {
        flex: 1,
        height: 160,
        borderRadius: Radius.md,
        overflow: "hidden",
        backgroundColor: Colors.black,
    },
    cardPinned: {
        borderWidth: 2,
        borderColor: Colors.accent,
    },
    cardInner: {
        flex: 1,
        padding: 8,
        alignItems: "flex-end",
    },
    pinIcon: {
        marginTop: 2,
    },
    cardOverlay: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: "rgba(0,0,0,0.55)",
    },
    cardTitle: {
        color: Colors.white,
        fontSize: 13,
        fontWeight: "600",
        lineHeight: 17,
    },
    cardSerial: {
        color: Colors.darkTextSecondary,
        fontSize: 11,
        marginTop: 2,
    },
    empty: {
        alignItems: "center",
        paddingTop: 60,
        gap: 10,
    },
    emptyText: {
        color: Colors.textMuted,
        fontSize: 14,
    },
});
