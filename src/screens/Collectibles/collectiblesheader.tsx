import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { Colors, getColors, Radius } from "../../shared/theme";

type Props = {
    query: string;
    setQuery: (q: string) => void;
};

export default function CollectiblesHeader({ query, setQuery }: Props) {
    const C = getColors(useAppTheme().theme);
    const navigation = useNavigation<any>();

    return (
        <View style={[styles.container, { backgroundColor: C.headerBg }]}>
            <View style={styles.titleRow}>
                <Text style={[styles.title, { color: C.text }]}>Your Collectibles</Text>
                {/* "+" creates a new event so tickets can be minted from it */}
                <TouchableOpacity
                    onPress={() => navigation.navigate("CreateEvent")}
                    style={styles.addBtn}
                >
                    <Ionicons name="add" size={24} color={C.text} />
                </TouchableOpacity>
            </View>

            <View style={[styles.searchWrap, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Ionicons name="search" size={15} color={C.textMuted} />
                <TextInput
                    placeholder="Search tickets"
                    placeholderTextColor={Colors.textMuted}
                    value={query}
                    onChangeText={setQuery}
                    style={[styles.input, { color: C.text }]}
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery("")}>
                        <Ionicons name="close-circle" size={16} color={C.textMuted} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 8,
        backgroundColor: Colors.headerBg,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: Colors.text,
    },
    addBtn: {
        padding: 4,
    },
    searchWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.surface,
        borderRadius: Radius.md,
        paddingHorizontal: 12,
        paddingVertical: 9,
        gap: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: Colors.text,
        padding: 0,
    },
});
