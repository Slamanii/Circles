import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { useAppTheme } from "../context/ThemeContext";
import { getColors } from "../shared/theme";

// Replace with your key from Google Cloud Console → Places API
const GOOGLE_PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? "YOUR_API_KEY_HERE";

type Props = {
    visible: boolean;
    onClose: () => void;
    onSelect: (city: string) => void;
};

export function LocationPicker({ visible, onClose, onSelect }: Props) {
    const { theme } = useAppTheme();
    const C = getColors(theme);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: C.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color={C.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: C.text }]}>Choose City</Text>
                    <View style={{ width: 36 }} />
                </View>

                <GooglePlacesAutocomplete
                    placeholder="Search city or area..."
                    onPress={(data) => {
                        // Use the main_text (city name) for a clean short label
                        const city = data.structured_formatting?.main_text ?? data.description;
                        onSelect(city);
                        onClose();
                    }}
                    query={{
                        key: GOOGLE_PLACES_KEY,
                        language: "en",
                        types: "(cities)",  // city-level only
                    }}
                    fetchDetails={false}
                    enablePoweredByContainer={false}
                    styles={{
                        container: { flex: 1 },
                        textInputContainer: {
                            paddingHorizontal: 16,
                            paddingTop: 12,
                        },
                        textInput: {
                            height: 48,
                            borderRadius: 14,
                            paddingHorizontal: 14,
                            fontSize: 15,
                            backgroundColor: C.card,
                            color: C.text,
                        },
                        listView: {
                            marginHorizontal: 16,
                            borderRadius: 14,
                            overflow: "hidden",
                            backgroundColor: C.card,
                        },
                        row: {
                            backgroundColor: C.card,
                            paddingVertical: 14,
                            paddingHorizontal: 16,
                        },
                        description: {
                            color: C.text,
                            fontSize: 14,
                        },
                        poweredContainer: { display: "none" },
                        separator: {
                            height: StyleSheet.hairlineWidth,
                            backgroundColor: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                        },
                    }}
                    textInputProps={{
                        placeholderTextColor: C.textMuted,
                        autoFocus: true,
                        clearButtonMode: "while-editing",
                    }}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 56,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    closeBtn: { width: 36, height: 36, justifyContent: "center" },
    title: { fontSize: 17, fontWeight: "700" },
});
