import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRef } from "react";
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { Colors, getColors, Radius } from "../../shared/theme";

type Props = {
    showBack?: boolean;
    onCreateEvent?: () => void;
    // search — not required when showBack is true
    searchActive?: boolean;
    query?: string;
    onEnterSearch?: () => void;
    onExitSearch?: () => void;
    onQueryChange?: (q: string) => void;
};

export default function EventHeader({
    showBack = false,
    onCreateEvent,
    searchActive = false,
    query = "",
    onEnterSearch,
    onExitSearch,
    onQueryChange,
}: Props) {
    const C = getColors(useAppTheme().theme);
    const navigation = useNavigation<any>();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const inputRef = useRef<TextInput>(null);

    const enterSearch = () => {
        onEnterSearch?.();
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const exitSearch = () => {
        onExitSearch?.();
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
        inputRef.current?.blur();
    };

    return (
        <View style={[styles.container, { backgroundColor: C.headerBg }]}>
            {searchActive ? (
                <Animated.View style={[styles.searchRow, { opacity: fadeAnim, backgroundColor: C.surface }]}>
                    <Ionicons name="search" size={16} color={C.textMuted} />
                    <TextInput
                        ref={inputRef}
                        placeholder="Search events..."
                        placeholderTextColor={C.textMuted}
                        value={query}
                        onChangeText={onQueryChange}
                        style={[styles.searchInput, { color: C.text }]}
                        returnKeyType="search"
                        autoCapitalize="none"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => onQueryChange?.("")}>
                            <Ionicons name="close-circle" size={17} color={C.textMuted} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={exitSearch} style={styles.cancelBtn}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </Animated.View>
            ) : (
                <>
                    {showBack ? (
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={[styles.back, { color: C.text }]}>←</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={[styles.title, { color: C.text }]}>Events</Text>
                    )}

                    <View style={styles.actions}>
                        {onEnterSearch && (
                            <TouchableOpacity onPress={enterSearch} style={styles.iconBtn}>
                                <Ionicons name="search" size={20} color={C.text} />
                            </TouchableOpacity>
                        )}
                        {onCreateEvent && (
                            <TouchableOpacity onPress={onCreateEvent} style={styles.createBtn}>
                                <Text style={styles.createText}>+ Create</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 50,
        marginBottom: 12,
        paddingHorizontal: 16,
        minHeight: 44,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
    },
    back: {
        fontSize: 22,
    },
    actions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    iconBtn: {
        padding: 4,
    },
    createBtn: {
        backgroundColor: "#3B82F6",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: Radius.sm,
    },
    createText: {
        color: Colors.white,
        fontWeight: "600",
        fontSize: 13,
    },
    // search bar
    searchRow: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: Radius.md,
        paddingHorizontal: 10,
        paddingVertical: 8,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        padding: 0,
    },
    cancelBtn: {
        paddingLeft: 6,
    },
    cancelText: {
        fontSize: 14,
        color: Colors.accent,
        fontWeight: "600",
    },
});
