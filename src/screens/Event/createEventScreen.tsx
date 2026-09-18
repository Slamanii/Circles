import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
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
    const [message, setMessage] = useState("");
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
    const [loading, setLoading] = useState(false);
    const [flyerUri, setFlyerUri] = useState<string | null>(null);

    // Base tier — always present, always required
    const [baseSupply, setBaseSupply] = useState("");
    const [basePrice, setBasePrice] = useState("");
    const [baseInfo, setBaseInfo] = useState("");

    // VIP tier — collapsed accordion, optional
    const [vipOpen, setVipOpen] = useState(false);
    const [vipSupply, setVipSupply] = useState("");
    const [vipPrice, setVipPrice] = useState("");
    const [vipInfo, setVipInfo] = useState("");

    // VIP++ tier — collapsed accordion, optional, independent of VIP
    const [vipPlusOpen, setVipPlusOpen] = useState(false);
    const [vipPlusSupply, setVipPlusSupply] = useState("");
    const [vipPlusPrice, setVipPlusPrice] = useState("");
    const [vipPlusInfo, setVipPlusInfo] = useState("");

    const pickFlyer = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [2, 3],
            quality: 0.85,
        });
        if (!result.canceled && result.assets[0]) setFlyerUri(result.assets[0].uri);
    };

    const isValid = title.trim() && venue.trim() && basePrice.trim() && baseSupply.trim() && eventDate
        && (!vipOpen || (vipPrice.trim() && vipSupply.trim()))
        && (!vipPlusOpen || (vipPlusPrice.trim() && vipPlusSupply.trim()));

    const handleSubmit = async () => {
        if (!isValid || !eventDate) return;

        const tiers = [{ name: "Base", price: parseInt(basePrice, 10), supply: parseInt(baseSupply, 10), info: baseInfo.trim() || undefined }];
        if (vipOpen) tiers.push({ name: "VIP", price: parseInt(vipPrice, 10), supply: parseInt(vipSupply, 10), info: vipInfo.trim() || undefined });
        if (vipPlusOpen) tiers.push({ name: "VIP++", price: parseInt(vipPlusPrice, 10), supply: parseInt(vipPlusSupply, 10), info: vipPlusInfo.trim() || undefined });

        for (const tier of tiers) {
            if (isNaN(tier.price) || tier.price <= 0) { Alert.alert(`Invalid price for ${tier.name}`); return; }
            if (isNaN(tier.supply) || tier.supply < 1) { Alert.alert(`Invalid ticket count for ${tier.name}`); return; }
        }
        if (eventDate <= new Date()) { Alert.alert("Event date must be in the future"); return; }

        setLoading(true);
        try {
            let flyerCard: string | undefined;
            if (flyerUri) flyerCard = await uploadFlyer(flyerUri);

            await createEvent({
                title: title.trim(),
                description: (description.trim() || message.trim()) || undefined,
                venue: venue.trim(),
                tiers,
                eventDate: eventDate.toISOString(),
                flyerCard,
            });
            Alert.alert("Event created!", "Your tickets are being minted.", [
                { text: "OK", onPress: () => navigation.goBack() },
            ]);
        } catch (err) {
            Alert.alert("Failed to create event", err instanceof Error ? err.message : "Unknown error");
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

            {/* Card 2 — messages */}
            <View style={[styles.card, { backgroundColor: C.card }]}>
                <FieldRow placeholder="Messages" value={message} onChangeText={setMessage} theme={theme} C={C} isLast />
            </View>

            {/* Ticket tiers: Base always shown, VIP / VIP++ are optional accordions */}
            <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>Base Tier</Text>
            <View style={[styles.card, { backgroundColor: C.card }]}>
                <FieldRow placeholder="No of Tickets" value={baseSupply} onChangeText={setBaseSupply} keyboardType="number-pad" theme={theme} C={C} />
                <FieldRow placeholder="Ticket Amount" value={basePrice}  onChangeText={setBasePrice}  keyboardType="number-pad" theme={theme} C={C} />
                <FieldRow placeholder="Tier Info (seating, perks, etc.)" value={baseInfo} onChangeText={setBaseInfo} theme={theme} C={C} isLast />
            </View>

            <TouchableOpacity
                style={[styles.card, styles.accordionHeader, { backgroundColor: C.card }]}
                onPress={() => setVipOpen(o => !o)}
            >
                <Text style={[styles.accordionText, { color: C.text }]}>{vipOpen ? "− Remove VIP" : "+ Add VIP"}</Text>
            </TouchableOpacity>
            {vipOpen && (
                <View style={[styles.card, { backgroundColor: C.card }]}>
                    <FieldRow placeholder="No of Tickets" value={vipSupply} onChangeText={setVipSupply} keyboardType="number-pad" theme={theme} C={C} />
                    <FieldRow placeholder="Ticket Amount" value={vipPrice}  onChangeText={setVipPrice}  keyboardType="number-pad" theme={theme} C={C} />
                    <FieldRow placeholder="Tier Info (seating, perks, etc.)" value={vipInfo} onChangeText={setVipInfo} theme={theme} C={C} isLast />
                </View>
            )}

            <TouchableOpacity
                style={[styles.card, styles.accordionHeader, { backgroundColor: C.card }]}
                onPress={() => setVipPlusOpen(o => !o)}
            >
                <Text style={[styles.accordionText, { color: C.text }]}>{vipPlusOpen ? "− Remove VIP++" : "+ Add VIP++"}</Text>
            </TouchableOpacity>
            {vipPlusOpen && (
                <View style={[styles.card, { backgroundColor: C.card }]}>
                    <FieldRow placeholder="No of Tickets" value={vipPlusSupply} onChangeText={setVipPlusSupply} keyboardType="number-pad" theme={theme} C={C} />
                    <FieldRow placeholder="Ticket Amount" value={vipPlusPrice}  onChangeText={setVipPlusPrice}  keyboardType="number-pad" theme={theme} C={C} />
                    <FieldRow placeholder="Tier Info (seating, perks, etc.)" value={vipPlusInfo} onChangeText={setVipPlusInfo} theme={theme} C={C} isLast />
                </View>
            )}

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
    sectionLabel: {
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    accordionHeader: {
        paddingVertical: 16,
        alignItems: "center",
    },
    accordionText: {
        fontSize: 15,
        fontWeight: "700",
    },
});
