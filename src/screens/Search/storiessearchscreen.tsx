import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState } from "react";
import {
    Animated,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { Colors, getColors, Radius, TAB_PAD } from "../../shared/theme";
import useSearchLogic from "./searchlogic";

// Two mutually exclusive screen modes — like a switch/case over UI state
type Mode = "stories" | "search";

function StoryCircle({ item, onPress }: { item: any; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.storyItem} onPress={onPress}>
            <LinearGradient
                colors={["#FF0080", "#FF8C00", "#40E0D0", "#7B2FBE"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.storyGradientRing}
            >
                <View style={styles.storyInnerBorder}>
                    <Image
                        source={{ uri: item.subStories?.[0]?.mediaUrl ?? item.storyItems?.[0]?.media_url }}
                        style={styles.storyAvatar}
                    />
                </View>
            </LinearGradient>
            <Text style={styles.storyName} numberOfLines={1}>
                {item.userName ?? item.users?.username}
            </Text>
        </TouchableOpacity>
    );
}

type TopBarProps = {
    mode: Mode;
    fadeAnim: Animated.Value;
    inputRef: React.RefObject<TextInput | null>;
    query: string;
    setQuery: (q: string) => void;
    onEnterSearch: () => void;
    onExitSearch: () => void;
    colors: ReturnType<typeof getColors>;
};

function TopBar({ mode, fadeAnim, inputRef, query, setQuery, onEnterSearch, onExitSearch, colors }: TopBarProps) {
    return (
        <View style={[styles.topBar, { backgroundColor: colors.headerBg }]}>
            {mode === "stories" ? (
                <>
                    <Text style={[styles.topTitle, { color: colors.text }]}>Stories</Text>
                    <TouchableOpacity onPress={onEnterSearch} style={styles.searchIconBtn}>
                        <Ionicons name="search" size={22} color={colors.text} />
                    </TouchableOpacity>
                </>
            ) : (
                <Animated.View style={[styles.searchRow, { opacity: fadeAnim, backgroundColor: colors.surface }]}>
                    <Ionicons name="search" size={16} color={colors.textMuted} />
                    <TextInput
                        ref={inputRef}
                        placeholder="Search users..."
                        placeholderTextColor={colors.textMuted}
                        value={query}
                        onChangeText={setQuery}
                        style={[styles.searchInput, { color: colors.text }]}
                        returnKeyType="search"
                        autoCapitalize="none"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery("")}>
                            <Ionicons name="close-circle" size={17} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={onExitSearch} style={styles.cancelBtn}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
}

export default function StoriesSearchScreen() {
    const C = getColors(useAppTheme().theme);
    const [mode, setMode] = useState<Mode>("stories");
    const [refreshing, setRefreshing] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const {
        query,
        setQuery,
        results,
        stories,
        discoverStories,
        loading,
        recentSearches,
        onStoryPress,
        onUploadPress,
        onUserPress,
        onRecentPress,
        onRemoveRecent,
        reload,
    } = useSearchLogic();

    const enterSearch = () => {
        setMode("search");
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const exitSearch = () => {
        setQuery("");
        setMode("stories");
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        inputRef.current?.blur();
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await reload?.();
        setRefreshing(false);
    };

    /* ════════════════════════════════════
       MODE: "stories" — story row + discover grid
    ════════════════════════════════════ */
    if (mode === "stories") {
        return (
            <View style={[styles.container, { backgroundColor: C.background }]}>
                <TopBar
                        mode={mode}
                        fadeAnim={fadeAnim}
                        inputRef={inputRef}
                        query={query}
                        setQuery={setQuery}
                        onEnterSearch={enterSearch}
                        onExitSearch={exitSearch}
                        colors={C}
                    />

                {/* Horizontal story circles */}
                <FlatList
                    data={stories}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.storyId ?? item.id}
                    contentContainerStyle={styles.storyRow}
                    ListHeaderComponent={
                        <TouchableOpacity style={styles.storyItem} onPress={onUploadPress}>
                            <View style={styles.uploadCircle}>
                                <Ionicons name="add" size={26} color={Colors.accent} />
                            </View>
                            <Text style={styles.storyName}>Your story</Text>
                        </TouchableOpacity>
                    }
                    renderItem={({ item }) => (
                        <StoryCircle
                            item={item}
                            onPress={() => onStoryPress(item.storyId ?? item.id)}
                        />
                    )}
                />

                {/* Discover grid */}
                <FlatList
                    data={discoverStories}
                    numColumns={2}
                    key="discover"
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.discoverGrid}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Colors.accent}
                            colors={[Colors.accent]}
                        />
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.discoverItem}
                            activeOpacity={0.85}
                            onPress={() => onStoryPress(item.id)}
                        >
                            <Image
                                source={{ uri: item.preview_media_snapshot ?? item.storyItems?.[0]?.media_url }}
                                style={styles.discoverImage}
                            />
                            <View style={styles.discoverOverlay}>
                                <Text style={styles.discoverName} numberOfLines={1}>
                                    {item.users?.username}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Ionicons name="compass-outline" size={40} color={C.textMuted} />
                            <Text style={[styles.emptyText, { color: C.textMuted }]}>Nothing to discover yet</Text>
                        </View>
                    }
                />
            </View>
        );
    }

    /* ════════════════════════════════════
       MODE: "search" — recents or live results
    ════════════════════════════════════ */
    const showRecents = query.trim().length === 0 && recentSearches.length > 0;
    const showResults = query.trim().length > 0;

    return (
        <View style={[styles.container, { backgroundColor: C.background }]}>
            <TopBar
                mode={mode}
                fadeAnim={fadeAnim}
                inputRef={inputRef}
                query={query}
                setQuery={setQuery}
                onEnterSearch={enterSearch}
                onExitSearch={exitSearch}
                colors={C}
            />

            {showRecents && (
                <FlatList
                    data={recentSearches}
                    keyExtractor={(item) => item}
                    contentContainerStyle={styles.resultsList}
                    ListHeaderComponent={<Text style={[styles.sectionLabel, { color: C.textSecondary }]}>Recent</Text>}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.userRow} onPress={() => onRecentPress(item)}>
                            <Ionicons name="time-outline" size={18} color={C.textMuted} />
                            <Text style={[styles.username, { flex: 1, color: C.text }]}>{item}</Text>
                            <TouchableOpacity onPress={() => onRemoveRecent(item)} style={{ padding: 4 }}>
                                <Ionicons name="close" size={14} color={C.textMuted} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                />
            )}

            {showResults && (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.resultsList}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.userRow} onPress={() => onUserPress(item.id)}>
                            <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
                            <View style={styles.userInfo}>
                                <Text style={[styles.username, { color: C.text }]}>{item.username}</Text>
                                {item.display_name ? (
                                    <Text style={styles.displayName}>{item.display_name}</Text>
                                ) : null}
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyBox}>
                                <Text style={[styles.emptyText, { color: C.textMuted }]}>No users found for "{query}"</Text>
                            </View>
                        ) : null
                    }
                />
            )}

            {!showRecents && !showResults && (
                <View style={styles.emptyBox}>
                    <Ionicons name="search-outline" size={36} color={C.textMuted} />
                    <Text style={[styles.emptyText, { color: C.textMuted }]}>Search for someone</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: 56,
    },
    // Top bar
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        marginBottom: 14,
        height: 36,
        backgroundColor: Colors.headerBg,
    },
    topTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: Colors.text,
    },
    searchIconBtn: {
        padding: 4,
    },
    searchRow: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.surface,
        borderRadius: Radius.md,
        paddingHorizontal: 10,
        paddingVertical: 8,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: Colors.text,
        padding: 0,
    },
    cancelBtn: {
        paddingLeft: 8,
    },
    cancelText: {
        fontSize: 14,
        color: Colors.accent,
        fontWeight: "600",
    },
    // Stories
    storyRow: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 18,
    },
    storyItem: {
        alignItems: "center",
        width: 66,
        gap: 5,
    },
    // RGB gradient ring: gradient fills the outer circle; a white ring sits inside
    storyGradientRing: {
        width: 66,
        height: 66,
        borderRadius: 33,
        padding: 2.5,          // thickness of the gradient ring
        justifyContent: "center",
        alignItems: "center",
    },
    storyInnerBorder: {
        width: "100%",
        height: "100%",
        borderRadius: 30,
        borderWidth: 2,        // white gap between gradient and avatar
        borderColor: Colors.white,
        overflow: "hidden",
    },
    storyAvatar: {
        width: "100%",
        height: "100%",
        backgroundColor: Colors.surface,
    },
    storyName: {
        fontSize: 11,
        color: Colors.textSecondary,
        textAlign: "center",
    },
    uploadCircle: {
        width: 66,
        height: 66,
        borderRadius: 33,
        borderWidth: 2,
        borderColor: Colors.accent,
        borderStyle: "dashed",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.accentLight,
    },
    // Discover
    discoverGrid: {
        paddingBottom: TAB_PAD,
    },
    discoverItem: {
        flex: 1,
        margin: 1.5,
        aspectRatio: 1,
        backgroundColor: Colors.surface,
        overflow: "hidden",
    },
    discoverImage: {
        width: "100%",
        height: "100%",
    },
    discoverOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 6,
        paddingVertical: 5,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    discoverName: {
        fontSize: 11,
        color: Colors.white,
        fontWeight: "500",
    },
    // Search results / recents
    sectionLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    resultsList: {
        paddingHorizontal: 16,
        paddingBottom: TAB_PAD,
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 11,
        gap: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: Colors.border,
    },
    userAvatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: Colors.surface,
    },
    userInfo: {
        flex: 1,
        gap: 2,
    },
    username: {
        fontSize: 15,
        fontWeight: "600",
        color: Colors.text,
    },
    displayName: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    emptyBox: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 60,
        gap: 10,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textMuted,
    },
});
