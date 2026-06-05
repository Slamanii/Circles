import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import EventCard from "../../components/EventCard";
import { useAppTheme } from "../../context/ThemeContext";
import { useEventFilter } from "../../hooks/useEventFilter";

type SortKey = "forYou" | "date" | "price" | "location";
import { Colors, getColors, Radius, TAB_PAD } from "../../shared/theme";
import EventHeader from "./eventheader";
import { useEventLogic } from "./eventlogic";

const FILTERS: { key: SortKey; label: string }[] = [
    { key: "forYou",   label: "All Events" },
    { key: "date",     label: "Date" },
    { key: "price",    label: "Price" },
    { key: "location", label: "Location" },
];

const FILTER_HEIGHT = 44;

export default function EventScreen() {
    const C = getColors(useAppTheme().theme);
    const navigation = useNavigation<any>();

    const [refreshing, setRefreshing] = useState(false);
    const [searchActive, setSearchActive] = useState(false);
    const [query, setQuery] = useState("");
    const [location, setLocation] = useState("");

    const [sortBy, setSortBy] = useState<SortKey>("forYou");

    const { events, loading, error, reload, likedIds, savedIds, handleLike, handlePreSave, handleGetTicket } = useEventLogic();
    const { filtered } = useEventFilter(events, location);

    // Debounce query
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedQuery(query), 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query]);

    // User location for "near me" filter
    useEffect(() => {
        AsyncStorage.getItem("user")
            .then(raw => raw ? setLocation(JSON.parse(raw).location ?? "") : null)
            .catch(() => {});
    }, []);

    // Filter chips slide-to-hide on scroll
    const scrollY = useRef(0);
    const filterAnim = useRef(new Animated.Value(1)).current;

    const handleScroll = (e: any) => {
        const currentY = e.nativeEvent.contentOffset.y;
        const diff = currentY - scrollY.current;

        if (diff > 8 && currentY > FILTER_HEIGHT) {
            Animated.timing(filterAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start();
        } else if (diff < -8) {
            Animated.timing(filterAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
        }
        scrollY.current = currentY;
    };

    const displayed = useMemo(() => {
        let result = debouncedQuery.trim()
            ? (() => {
                const q = debouncedQuery.trim().toLowerCase();
                return filtered.filter(e =>
                    e.title.toLowerCase().includes(q) ||
                    e.venue?.toLowerCase().includes(q)
                );
            })()
            : [...filtered];

        switch (sortBy) {
            case "date":
                result.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
                break;
            case "price":
                result.sort((a, b) => a.ticket_price - b.ticket_price);
                break;
            case "location": {
                const token = location.split(",")[0]?.trim().toLowerCase();
                if (token) {
                    const near = result.filter(e => e.venue.toLowerCase().includes(token));
                    const rest = result.filter(e => !e.venue.toLowerCase().includes(token));
                    result = [...near, ...rest];
                }
                break;
            }
            // "forYou" — already sorted by the hook
        }
        return result;
    }, [filtered, debouncedQuery, sortBy, location]);

    const onRefresh = async () => {
        setRefreshing(true);
        await reload();
        setRefreshing(false);
    };

    const exitSearch = () => {
        setSearchActive(false);
        setQuery("");
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: C.background }]}>
                <ActivityIndicator color={Colors.accent} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.center, { backgroundColor: C.background }]}>
                <Text style={[styles.errorText, { color: C.textSecondary }]}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: C.background }]}>
            <EventHeader
                onCreateEvent={() => navigation.navigate("CreateEvent")}
                searchActive={searchActive}
                query={query}
                onEnterSearch={() => setSearchActive(true)}
                onExitSearch={exitSearch}
                onQueryChange={setQuery}
            />

            {/* Filter chips — slide up on scroll down, return on scroll up */}
            {!searchActive && (
                <Animated.View style={[
                    styles.chipWrapper,
                    {
                        opacity: filterAnim,
                        transform: [{
                            translateY: filterAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-FILTER_HEIGHT, 0],
                            }),
                        }],
                    },
                ]}>
                    <FlatList
                        horizontal
                        data={FILTERS}
                        keyExtractor={f => f.key}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipRow}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => setSortBy(item.key)}
                                style={[
                                    styles.chip,
                                    { borderColor: C.border, backgroundColor: C.surface },
                                    sortBy === item.key && styles.chipActive,
                                ]}
                            >
                                <Text style={[
                                    styles.chipText,
                                    { color: C.textSecondary },
                                    sortBy === item.key && styles.chipTextActive,
                                ]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </Animated.View>
            )}

            <FlatList
                data={displayed}
                keyExtractor={item => item.id}
                onScroll={handleScroll}
                scrollEventThrottle={16}
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
                contentContainerStyle={{ paddingBottom: TAB_PAD }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.accent}
                        colors={[Colors.accent]}
                    />
                }
                ListEmptyComponent={
                    debouncedQuery.trim() ? (
                        <View style={styles.empty}>
                            <Ionicons name="search-outline" size={36} color={C.textMuted} />
                            <Text style={[styles.emptyText, { color: C.textMuted }]}>
                                No events for "{debouncedQuery}"
                            </Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    errorText: { fontSize: 14 },
    chipWrapper: {
        height: FILTER_HEIGHT,
        overflow: "hidden",
    },
    chipRow: {
        paddingHorizontal: 16,
        gap: 8,
        alignItems: "center",
    },
    chip: {
        borderWidth: 1,
        borderRadius: Radius.full,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    chipActive: {
        backgroundColor: Colors.accent,
        borderColor: Colors.accent,
    },
    chipText: {
        fontSize: 13,
        fontWeight: "500",
    },
    chipTextActive: {
        color: Colors.white,
        fontWeight: "600",
    },
    empty: {
        alignItems: "center",
        paddingTop: 60,
        gap: 10,
    },
    emptyText: { fontSize: 14 },
});
