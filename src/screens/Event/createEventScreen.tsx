import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { createEvent } from "../../services/eventService";

export default function CreateEventScreen() {
    const navigation = useNavigation<any>();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [venue, setVenue] = useState("");
    const [ticketPrice, setTicketPrice] = useState("");
    const [ticketSupply, setTicketSupply] = useState("");
    const [eventDate, setEventDate] = useState<Date | null>(null);
    const [showPicker, setShowPicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const isValid =
        title.trim() &&
        description.trim() &&
        venue.trim() &&
        ticketPrice.trim() &&
        ticketSupply.trim() &&
        eventDate !== null;

    const handleSubmit = async () => {
        if (!isValid || !eventDate) return;

        const price = parseInt(ticketPrice, 10);
        const supply = parseInt(ticketSupply, 10);

        if (isNaN(price) || price < 0) {
            Alert.alert("Invalid price");
            return;
        }
        if (isNaN(supply) || supply < 1) {
            Alert.alert("Invalid ticket supply");
            return;
        }
        if (eventDate <= new Date()) {
            Alert.alert("Event date must be in the future");
            return;
        }

        setLoading(true);
        try {
            await createEvent({
                title: title.trim(),
                description: description.trim(),
                venue: venue.trim(),
                ticketPrice: price,
                ticketSupply: supply,
                eventDate: eventDate.toISOString(),
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
        <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
                <Text style={{ color: "white", fontSize: 18 }}>←</Text>
            </TouchableOpacity>

            <Text style={styles.heading}>Create Event</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput
                style={styles.input}
                placeholder="Event name"
                placeholderTextColor="#64748B"
                value={title}
                onChangeText={setTitle}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="What's this event about?"
                placeholderTextColor="#64748B"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
            />

            <Text style={styles.label}>Venue</Text>
            <TextInput
                style={styles.input}
                placeholder="Location or address"
                placeholderTextColor="#64748B"
                value={venue}
                onChangeText={setVenue}
            />

            <Text style={styles.label}>Ticket Price (₦)</Text>
            <TextInput
                style={styles.input}
                placeholder="0 for free"
                placeholderTextColor="#64748B"
                value={ticketPrice}
                onChangeText={setTicketPrice}
                keyboardType="number-pad"
            />

            <Text style={styles.label}>Ticket Supply</Text>
            <TextInput
                style={styles.input}
                placeholder="How many tickets?"
                placeholderTextColor="#64748B"
                value={ticketSupply}
                onChangeText={setTicketSupply}
                keyboardType="number-pad"
            />

            <Text style={styles.label}>Event Date & Time</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
                <Text style={{ color: eventDate ? "white" : "#64748B" }}>
                    {eventDate
                        ? eventDate.toLocaleString()
                        : "Select date and time"}
                </Text>
            </TouchableOpacity>

            {showPicker && (
                <DateTimePicker
                    value={eventDate ?? new Date()}
                    mode="datetime"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    minimumDate={new Date()}
                    onChange={(_, selected) => {
                        setShowPicker(Platform.OS === "ios");
                        if (selected) setEventDate(selected);
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
                    : <Text style={styles.submitText}>Create & Mint Tickets</Text>
                }
            </TouchableOpacity>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F172A" },
    content: { padding: 20, paddingBottom: 60 },
    back: { marginTop: 40, marginBottom: 16 },
    heading: { color: "white", fontSize: 24, fontWeight: "bold", marginBottom: 24 },
    label: { color: "#94A3B8", fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 14 },
    input: {
        backgroundColor: "#1E293B",
        color: "white",
        borderRadius: 10,
        padding: 14,
        fontSize: 14,
    },
    multiline: {
        minHeight: 100,
        textAlignVertical: "top",
    },
    submitBtn: {
        marginTop: 32,
        backgroundColor: "#3B82F6",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    submitBtnDisabled: {
        backgroundColor: "#334155",
    },
    submitText: {
        color: "white",
        fontWeight: "700",
        fontSize: 15,
    },
});
