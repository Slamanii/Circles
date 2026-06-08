import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import EventCard from "../../components/EventCard";
import FilterSheet, { FilterSheetType } from "../../components/FilterSheet";
import { useAppTheme } from "../../context/ThemeContext";
import { useEventFilter } from "../../hooks/useEventFilter";
import { Colors, getColors, Radius, TAB_PAD } from "../../shared/theme";
import { useEventLogic } from "../Event/eventlogic";
import HomeHeader from "./homeheader";
import { useHomeLogic } from "./homelogic";

type Chip = { key: FilterSheetType | "all"; label: string };

const CHIPS: Chip[] = [
    { key: "all",      label: "All" },
    { key: "date",     label: "Date" },
    { key: "price",    label: "Price" },
    { key: "location", label: "Location" },
];

export default function HomeScreen() {
    const C = getColors(useAppTheme().theme);
    const navigation = useNavigation<any>();
    const [refreshing, setRefreshing]   = useState(false);
    const [searchActive, setSearchActive] = useState(false);
    const [query, setQuery]             = useState("");
    const [openSheet, setOpenSheet]     = useState<FilterSheetType | null>(null);

    const { events, loading, error, reload, likedIds, savedIds, handleLike } = useEventLogic();
    const { location, handlePreSave, handleGetTicket, onChatPress, onEventPress } = useHomeLogic();

    const {
        filtered,
        uniqueLocations,
        dateRange,        setDateRange,
        priceRange,       setPriceRange,
        selectedLocation, setSelectedLocation,
        hasDateFilter,
        hasPriceFilter,
        hasLocationFilter,
        clearAdvanced,
    } = useEventFilter(events, location);

    const fadeAnim  = useRef(new Animated.Value(0)).current;
    const inputRef  = useRef<TextInput>(null);

    const [debouncedQuery, setDebouncedQuery] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedQuery(query), 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query]);

    const displayed = useMemo(() => {
        if (!debouncedQuery.trim()) return filtered;
        const q = debouncedQuery.trim().toLowerCase();
        return filtered.filter(e =>
            e.title.toLowerCase().includes(q) ||
            e.venue?.toLowerCase().includes(q)
        );
    }, [filtered, debouncedQuery]);

    const enterSearch = () => {
        setSearchActive(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const exitSearch = () => {
        setSearchActive(false);
        setQuery("");
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        inputRef.current?.blur();
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await reload();
        setRefreshing(false);
    };

    const chipActive = (key: Chip["key"]) => {
        if (key === "all")      return !hasDateFilter && !hasPriceFilter && !hasLocationFilter;
        if (key === "date")     return hasDateFilter;
        if (key === "price")    return hasPriceFilter;
        if (key === "location") return hasLocationFilter;
        return false;
    };

    const onChipPress = (key: Chip["key"]) => {
        if (key === "all") { clearAdvanced(); return; }
        setOpenSheet(key as FilterSheetType);
    };

    if (loading) return (
        <View style={[styles.center, { backgroundColor: C.background }]}>
            <ActivityIndicator color={Colors.accent} />
        </View>
    );

    if (error) return (
        <View style={[styles.center, { backgroundColor: C.background }]}>
            <Text style={[styles.errorText, { color: C.textSecondary }]}>{error}</Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: C.background }]}>
            <HomeHeader
                address={location}
                onChatPress={onChatPress}
                onNotificationsPress={() => navigation.navigate("Notifications")}
                onLocationPress={() => navigation.navigate("EditProfile")}
            />

            {/* Nav row */}
            <View style={styles.navRow}>
                {searchActive ? (
                    <Animated.View style={[styles.searchBar, { opacity: fadeAnim, backgroundColor: C.surface }]}>
                        <Ionicons name="search" size={15} color={C.textMuted} />
                        <TextInput
                            ref={inputRef}
                            placeholder="Search events..."
                            placeholderTextColor={C.textMuted}
                            value={query}
                            onChangeText={setQuery}
                            style={[styles.searchInput, { color: C.text }]}
                            returnKeyType="search"
                            autoCapitalize="none"
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => setQuery("")}>
                                <Ionicons name="close-circle" size={16} color={C.textMuted} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={exitSearch} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </Animated.View>
                ) : (
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={CHIPS}
                        keyExtractor={f => f.key}
                        contentContainerStyle={styles.chipRow}
                        ListHeaderComponent={
                            <TouchableOpacity
                                onPress={enterSearch}
                                style={[styles.searchIcon, { backgroundColor: C.surface, borderColor: C.border }]}
                            >
                                <Ionicons name="search-outline" size={16} color={C.textSecondary} />
                            </TouchableOpacity>
                        }
                        renderItem={({ item }) => {
                            const active = chipActive(item.key);
                            return (
                                <TouchableOpacity
                                    onPress={() => onChipPress(item.key)}
                                    style={[
                                        styles.chip,
                                        { backgroundColor: C.surface, borderColor: C.border },
                                        active && styles.chipActive,
                                    ]}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        { color: C.textSecondary },
                                        active && styles.chipTextActive,
                                    ]}>
                                        {item.label}
                                    </Text>
                                    {item.key !== "all" && (
                                        <Ionicons
                                            name={active ? "options" : "chevron-down"}
                                            size={12}
                                            color={active ? Colors.white : C.textSecondary}
                                            style={{ marginLeft: 3 }}
                                        />
                                    )}
                                    {/* active dot indicator */}
                                    {active && item.key !== "all" && (
                                        <View style={styles.activeDot} />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />
                )}
            </View>

            <FlatList
                data={displayed}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.accent}
                        colors={[Colors.accent]}
                    />
                }
                renderItem={({ item }) => (
                    <TouchableOpacity activeOpacity={0.9} onPress={() => onEventPress(item.id)}>
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
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="calendar-outline" size={40} color={C.textMuted} />
                        <Text style={[styles.emptyText, { color: C.textMuted }]}>
                            {debouncedQuery.trim()
                                ? `No events for "${debouncedQuery}"`
                                : "No events match your filters"}
                        </Text>
                    </View>
                }
            />

            <FilterSheet
                visible={openSheet !== null}
                type={openSheet}
                dateRange={dateRange}
                onDateChange={setDateRange}
                priceRange={priceRange}
                onPriceChange={setPriceRange}
                locations={uniqueLocations}
                selectedLocation={selectedLocation}
                onLocationSelect={setSelectedLocation}
                onClose={() => setOpenSheet(null)}
                onClear={() => {
                    if (openSheet === "date")     setDateRange({ from: null, to: null });
                    if (openSheet === "price")    setPriceRange({ min: null, max: null });
                    if (openSheet === "location") setSelectedLocation(null);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container:  { flex: 1 },
    center:     { flex: 1, alignItems: "center", justifyContent: "center" },
    errorText:  { fontSize: 14 },
    navRow:     { paddingBottom: 8 },
    chipRow: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        gap: 8,
        alignItems: "center",
    },
    searchIcon: {
        width: 34,
        height: 34,
        borderRadius: Radius.full,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 4,
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 13,
        paddingVertical: 7,
        borderRadius: Radius.full,
        borderWidth: 1,
    },
    chipActive: {
        backgroundColor: Colors.accent,
        borderColor: Colors.accent,
    },
    chipText:       { fontSize: 13, fontWeight: "500" },
    chipTextActive: { color: Colors.white, fontWeight: "600" },
    activeDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: "#fff",
        marginLeft: 4,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: Radius.md,
        paddingHorizontal: 10,
        paddingVertical: 8,
        gap: 8,
    },
    searchInput: { flex: 1, fontSize: 15, padding: 0 },
    cancelBtn:   { paddingLeft: 4 },
    cancelText:  { fontSize: 14, color: Colors.accent, fontWeight: "600" },
    list:        { paddingBottom: TAB_PAD },
    empty:       { alignItems: "center", paddingTop: 60, gap: 10 },
    emptyText:   { fontSize: 15 },
});
