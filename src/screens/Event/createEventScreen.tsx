import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";
import { createEvent, uploadFlyer } from "../../services/eventService";

function dividerColor(theme: string) {
    return theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";
}

function FieldRow({
    placeholder,
    value,
    onChangeText,
    keyboardType,
    isLast,
    theme,
    C,
}: any) {
    return (
        <View>
            <TextInput
                placeholder={placeholder}
                placeholderTextColor={C.textSecondary}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType ?? "default"}
                style={[styles.fieldInput, { color: C.text }]}
            />
            {!isLast && <View style={[styles.divider, { backgroundColor: dividerColor(theme) }]} />}
        </View>
    );
}

function DateRow({ value, onPress, isLast, theme, C }: any) {
    return (
        <View>
            <TouchableOpacity onPress={onPress} style={styles.fieldInput}>
                <Text style={{ color: value ? C.text : C.textSecondary, fontSize: 15 }}>
                    {value ? new Date(value).toLocaleString() : "Date"}
                </Text>
            </TouchableOpacity>
            {!isLast && <View style={[styles.divider, { backgroundColor: dividerColor(theme) }]} />}
        </View>
    );
}

export default function CreateEventScreen() {
    const navigation = useNavigation<any>();
    const { theme } = useAppTheme();
    const C = getColors(theme);

    const [title, setTitle] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [eventDate, setEventDate] = useState<Date | null>(null);
    const [venue, setVenue] = useState("");
    const [ticketSupply, setTicketSupply] = useState("");
    const [message, setMessage] = useState("");
    const [ticketPrice, setTicketPrice] = useState("");
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
    const [loading, setLoading] = useState(false);
    const [flyerUri, setFlyerUri] = useState<string | null>(null);

    const pickFlyer = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [2, 3],
            quality: 0.85,
        });
        if (!result.canceled && result.assets[0]) setFlyerUri(result.assets[0].uri);
    };

    const isValid = title.trim() && venue.trim() && ticketPrice.trim() && ticketSupply.trim() && eventDate;

    const handleSubmit = async () => {
        if (!isValid || !eventDate) return;
        const price = parseInt(ticketPrice, 10);
        const supply = parseInt(ticketSupply, 10);
        if (isNaN(price) || price < 0) { Alert.alert("Invalid price"); return; }
        if (isNaN(supply) || supply < 1) { Alert.alert("Invalid ticket supply"); return; }
        if (eventDate <= new Date()) { Alert.alert("Event date must be in the future"); return; }

        setLoading(true);
        try {
            let flyerCard: string | undefined;
            if (flyerUri) flyerCard = await uploadFlyer(flyerUri);

            await createEvent({
                title: title.trim(),
                description: (description.trim() || message.trim()) || undefined,
                venue: venue.trim(),
                ticketPrice: price,
                ticketSupply: supply,
                eventDate: eventDate.toISOString(),
                flyerCard,
            });
            Alert.alert("Event created!", "Your tickets are being minted.", [
                { text: "OK", onPress: () => navigation.goBack() },
            ]);
        } catch (err: any) {
            Alert.alert("Failed to create event", err.message ?? "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: C.background }]}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={[styles.backText, { color: C.text }]}>←</Text>
            </TouchableOpacity>

            <Text style={[styles.heading, { color: C.text }]}>Add Event</Text>

            {/* Flyer picker — 2:3 portrait */}
            <TouchableOpacity style={[styles.flyerPicker, { backgroundColor: C.surface }]} onPress={pickFlyer}>
                {flyerUri ? (
                    <Image source={{ uri: flyerUri }} style={styles.flyerPreview} />
                ) : (
                    <Text style={[styles.flyerPrompt, { color: C.textSecondary }]}>+ Add Flyer</Text>
                )}
            </TouchableOpacity>

            {/* Card 1 */}
            <View style={[styles.card, { backgroundColor: C.card }]}>
                <FieldRow placeholder="Event Name"     value={title}       onChangeText={setTitle}       theme={theme} C={C} />
                <FieldRow placeholder="Event Location" value={location}    onChangeText={setLocation}    theme={theme} C={C} />
                <FieldRow placeholder="Personal Info"  value={description} onChangeText={setDescription} theme={theme} C={C} />
                <DateRow  value={eventDate} onPress={() => { setPickerMode("date"); setShowPicker(true); }} theme={theme} C={C} />
                <FieldRow placeholder="Venue Name"     value={venue}       onChangeText={setVenue}       theme={theme} C={C} isLast />
            </View>

            {/* Card 2 */}
            <View style={[styles.card, { backgroundColor: C.card }]}>
                <FieldRow placeholder="No of Tickets"  value={ticketSupply} onChangeText={setTicketSupply} keyboardType="number-pad" theme={theme} C={C} />
                <FieldRow placeholder="Messages"       value={message}      onChangeText={setMessage}      theme={theme} C={C} />
                <FieldRow placeholder="Ticket Amount"  value={ticketPrice}  onChangeText={setTicketPrice}  keyboardType="number-pad" theme={theme} C={C} isLast />
            </View>

            {showPicker && (
                <DateTimePicker
                    value={eventDate ?? new Date()}
                    mode={Platform.OS === "ios" ? "datetime" : pickerMode}
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    minimumDate={new Date()}
                    onChange={(_, selected) => {
                        if (Platform.OS === "android") {
                            setShowPicker(false);
                            if (selected) {
                                if (pickerMode === "date") {
                                    setEventDate(selected);
                                    setPickerMode("time");
                                    setShowPicker(true);
                                } else {
                                    setEventDate(prev => {
                                        const base = prev ?? new Date();
                                        base.setHours(selected.getHours(), selected.getMinutes());
                                        return new Date(base);
                                    });
                                    setPickerMode("date");
                                }
                            }
                        } else {
                            setShowPicker(false);
                            if (selected) setEventDate(selected);
                        }
                    }}
                />
            )}

            <TouchableOpacity
                style={[styles.submitBtn, (!isValid || loading) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!isValid || loading}
            >
                {loading
                    ? <ActivityIndicator color="white" />
                    : <Text style={styles.submitText}>Create Event</Text>
                }
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 60 },
    backBtn: { marginTop: 48, marginBottom: 12 },
    backText: { fontSize: 22 },
    heading: { fontSize: 26, fontWeight: "800", marginBottom: 24 },
    card: {
        borderRadius: 20,
        paddingHorizontal: 20,
        marginBottom: 16,
        overflow: "hidden",
    },
    fieldInput: {
        fontSize: 15,
        paddingVertical: 18,
        justifyContent: "center",
    },
    divider: {
        height: StyleSheet.hairlineWidth,
    },
    submitBtn: {
        marginTop: 8,
        backgroundColor: "#E8622A",
        padding: 16,
        borderRadius: 14,
        alignItems: "center",
    },
    submitBtnDisabled: { backgroundColor: "#ccc" },
    submitText: { color: "white", fontWeight: "700", fontSize: 15 },
    flyerPicker: {
        alignSelf: "center",
        width: 160,
        height: 240,
        borderRadius: 14,
        marginBottom: 24,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
    flyerPreview: { width: "100%", height: "100%" },
    flyerPrompt: { fontSize: 14, fontWeight: "600" },
});
