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
import { Colors, getColors } from "../../shared/theme";
import { createEvent, uploadEventVideo, uploadFlyer } from "../../services/eventService";

const MAX_VIDEO_SECONDS = 30;
const MAX_MOVIE_FLYERS = 5;

const CATEGORIES = [
    { key: "movie",        label: "Movie" },
    { key: "professional", label: "Professional" },
    { key: "concert",      label: "Concert" },
    { key: "birthday",     label: "Birthday" },
    { key: "sports",       label: "Sports" },
    { key: "educational",  label: "Educational" },
    { key: "private",      label: "Private" },
    { key: "other",        label: "Other" },
] as const;

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

    // A non-movie event may only carry one flyer image; a movie event may carry several.
    const [flyerUris, setFlyerUris] = useState<string[]>([]);

    const [category, setCategory] = useState<typeof CATEGORIES[number]["key"]>("other");
    const [customCategory, setCustomCategory] = useState("");

    // Movie-only — a single short clip, capped at MAX_VIDEO_SECONDS.
    const [videoUri, setVideoUri] = useState<string | null>(null);

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

    // Group ticket — one ticket, N admissions
    const [groupOpen, setGroupOpen] = useState(false);
    const [groupSupply, setGroupSupply] = useState("");
    const [groupPrice, setGroupPrice] = useState("");
    const [groupSize, setGroupSize] = useState("");
    const [groupInfo, setGroupInfo] = useState("");

    // Free ticket — no price, skips the payment terminal entirely
    const [freeOpen, setFreeOpen] = useState(false);
    const [freeSupply, setFreeSupply] = useState("");
    const [freeInfo, setFreeInfo] = useState("");

    const GUEST_SLOTS = 15;
    const [guestNames, setGuestNames] = useState<string[]>(Array(GUEST_SLOTS).fill(""));
    const setGuestName = (index: number, value: string) => {
        setGuestNames(prev => prev.map((n, i) => i === index ? value : n));
    };

    const pickFlyer = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: category !== "movie",
            aspect: [2, 3],
            quality: 0.85,
        });
        if (result.canceled || !result.assets[0]) return;

        const uri = result.assets[0].uri;
        if (category === "movie") {
            setFlyerUris(prev => prev.length >= MAX_MOVIE_FLYERS ? prev : [...prev, uri]);
        } else {
            setFlyerUris([uri]);
        }
    };

    const removeFlyer = (index: number) => {
        setFlyerUris(prev => prev.filter((_, i) => i !== index));
    };

    const pickVideo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["videos"],
            quality: 0.85,
        });
        if (result.canceled || !result.assets[0]) return;

        const asset = result.assets[0];
        if (asset.duration != null && asset.duration > MAX_VIDEO_SECONDS * 1000) {
            Alert.alert("Video too long", `Movie clips can be at most ${MAX_VIDEO_SECONDS} seconds.`);
            return;
        }
        setVideoUri(asset.uri);
    };

    const isValid = title.trim() && venue.trim() && basePrice.trim() && baseSupply.trim() && eventDate
        && (!vipOpen || (vipPrice.trim() && vipSupply.trim()))
        && (!vipPlusOpen || (vipPlusPrice.trim() && vipPlusSupply.trim()))
        && (!groupOpen || (groupPrice.trim() && groupSupply.trim() && groupSize.trim()))
        && (!freeOpen || freeSupply.trim())
        && (category !== "other" || customCategory.trim().length <= 15);

    const handleSubmit = async () => {
        if (!isValid || !eventDate) return;

        const tiers: any[] = [
            { name: "Base", price: parseInt(basePrice, 10), supply: parseInt(baseSupply, 10), info: baseInfo.trim() || undefined },
        ];
        if (vipOpen) tiers.push({ name: "VIP", price: parseInt(vipPrice, 10), supply: parseInt(vipSupply, 10), info: vipInfo.trim() || undefined });
        if (vipPlusOpen) tiers.push({ name: "VIP++", price: parseInt(vipPlusPrice, 10), supply: parseInt(vipPlusSupply, 10), info: vipPlusInfo.trim() || undefined });
        if (groupOpen) tiers.push({
            name: "Group", price: parseInt(groupPrice, 10), supply: parseInt(groupSupply, 10),
            groupTicket: parseInt(groupSize, 10), info: groupInfo.trim() || undefined,
        });
        if (freeOpen) tiers.push({ name: "Free", price: 0, free: true, supply: parseInt(freeSupply, 10), info: freeInfo.trim() || undefined });

        for (const tier of tiers) {
            if (!tier.free && (isNaN(tier.price) || tier.price <= 0)) { Alert.alert(`Invalid price for ${tier.name}`); return; }
            if (isNaN(tier.supply) || tier.supply < 1) { Alert.alert(`Invalid ticket count for ${tier.name}`); return; }
            if (tier.groupTicket != null && (isNaN(tier.groupTicket) || tier.groupTicket < 2)) {
                Alert.alert("Group size must be 2 or more"); return;
            }
        }
        if (eventDate <= new Date()) { Alert.alert("Event date must be in the future"); return; }

        setLoading(true);
        try {
            const flyerCards = await Promise.all(flyerUris.map(uri => uploadFlyer(uri)));
            const videoUrl = category === "movie" && videoUri ? await uploadEventVideo(videoUri) : undefined;
            const guestList = guestNames.map(n => n.trim()).filter(Boolean).join("\n") || undefined;

            await createEvent({
                title: title.trim(),
                description: (description.trim() || message.trim()) || undefined,
                venue: venue.trim(),
                tiers,
                eventDate: eventDate.toISOString(),
                flyerCards,
                category,
                customCategory: category === "other" ? (customCategory.trim() || undefined) : undefined,
                videoUrl,
                guestList,
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

            {/* Category */}
            <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>Category</Text>
            <View style={styles.categoryRow}>
                {CATEGORIES.map(c => (
                    <TouchableOpacity
                        key={c.key}
                        style={[
                            styles.categoryChip,
                            { backgroundColor: C.card, borderColor: category === c.key ? C.accentText : "transparent" },
                        ]}
                        onPress={() => {
                            setCategory(c.key);
                            if (c.key !== "movie") { setFlyerUris(prev => prev.slice(0, 1)); setVideoUri(null); }
                        }}
                    >
                        <Text style={[styles.categoryChipText, { color: category === c.key ? C.accentText : C.text }]}>
                            {c.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            {category === "other" && (
                <View style={[styles.card, { backgroundColor: C.card, marginTop: 8 }]}>
                    <FieldRow
                        placeholder="Custom category (one word, 15 chars max)"
                        value={customCategory}
                        onChangeText={(t: string) => setCustomCategory(t.replace(/\s/g, "").slice(0, 15))}
                        theme={theme} C={C} isLast
                    />
                </View>
            )}

            {/* Flyer picker(s) — one image, or several for a movie event */}
            <View style={styles.flyerRow}>
                {flyerUris.map((uri, i) => (
                    <View key={uri} style={[styles.flyerThumb, { backgroundColor: C.surface }]}>
                        <Image source={{ uri }} style={styles.flyerPreview} />
                        <TouchableOpacity style={styles.flyerRemove} onPress={() => removeFlyer(i)}>
                            <Text style={styles.flyerRemoveText}>×</Text>
                        </TouchableOpacity>
                    </View>
                ))}
                {(category === "movie" ? flyerUris.length < MAX_MOVIE_FLYERS : flyerUris.length === 0) && (
                    <TouchableOpacity style={[styles.flyerThumb, styles.flyerAdd, { backgroundColor: C.surface }]} onPress={pickFlyer}>
                        <Text style={[styles.flyerPrompt, { color: C.textSecondary }]}>+ Add Flyer</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Movie video — optional, one clip, 30s max */}
            {category === "movie" && (
                <TouchableOpacity style={[styles.card, styles.accordionHeader, { backgroundColor: C.card }]} onPress={pickVideo}>
                    <Text style={[styles.accordionText, { color: C.text }]}>
                        {videoUri ? "Video attached — tap to replace" : `+ Add Clip (max ${MAX_VIDEO_SECONDS}s)`}
                    </Text>
                </TouchableOpacity>
            )}

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

            {/* Ticket tiers: Base always shown, the rest are optional accordions */}
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

            <TouchableOpacity
                style={[styles.card, styles.accordionHeader, { backgroundColor: C.card }]}
                onPress={() => setGroupOpen(o => !o)}
            >
                <Text style={[styles.accordionText, { color: C.text }]}>{groupOpen ? "− Remove Group" : "+ Add Group Ticket"}</Text>
            </TouchableOpacity>
            {groupOpen && (
                <View style={[styles.card, { backgroundColor: C.card }]}>
                    <FieldRow placeholder="No of Tickets" value={groupSupply} onChangeText={setGroupSupply} keyboardType="number-pad" theme={theme} C={C} />
                    <FieldRow placeholder="Ticket Amount" value={groupPrice}  onChangeText={setGroupPrice}  keyboardType="number-pad" theme={theme} C={C} />
                    <FieldRow placeholder="People per ticket (2+)" value={groupSize} onChangeText={setGroupSize} keyboardType="number-pad" theme={theme} C={C} />
                    <FieldRow placeholder="Tier Info (seating, perks, etc.)" value={groupInfo} onChangeText={setGroupInfo} theme={theme} C={C} isLast />
                </View>
            )}

            <TouchableOpacity
                style={[styles.card, styles.accordionHeader, { backgroundColor: C.card }]}
                onPress={() => setFreeOpen(o => !o)}
            >
                <Text style={[styles.accordionText, { color: C.text }]}>{freeOpen ? "− Remove Free" : "+ Add Free Ticket"}</Text>
            </TouchableOpacity>
            {freeOpen && (
                <View style={[styles.card, { backgroundColor: C.card }]}>
                    <FieldRow placeholder="No of Tickets" value={freeSupply} onChangeText={setFreeSupply} keyboardType="number-pad" theme={theme} C={C} />
                    <FieldRow placeholder="Tier Info (seating, perks, etc.)" value={freeInfo} onChangeText={setFreeInfo} theme={theme} C={C} isLast />
                </View>
            )}

            <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>Guest List (up to 15, optional)</Text>
            <View style={[styles.card, { backgroundColor: C.card }]}>
                {guestNames.map((name, i) => (
                    <FieldRow
                        key={i}
                        placeholder={`Guest ${i + 1}`}
                        value={name}
                        onChangeText={(t: string) => setGuestName(i, t)}
                        theme={theme} C={C}
                        isLast={i === guestNames.length - 1}
                    />
                ))}
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
                    ? <ActivityIndicator color={Colors.black} />
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
        backgroundColor: Colors.accent,
        padding: 16,
        borderRadius: 14,
        alignItems: "center",
    },
    submitBtnDisabled: { backgroundColor: "#ccc" },
    submitText: { color: Colors.black, fontWeight: "700", fontSize: 15 },
    flyerRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        justifyContent: "center",
        marginBottom: 24,
    },
    flyerThumb: {
        width: 120,
        height: 180,
        borderRadius: 14,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
    flyerAdd: {},
    flyerPreview: { width: "100%", height: "100%" },
    flyerPrompt: { fontSize: 13, fontWeight: "600" },
    flyerRemove: {
        position: "absolute",
        top: 6,
        right: 6,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: "rgba(0,0,0,0.6)",
        alignItems: "center",
        justifyContent: "center",
    },
    flyerRemoveText: { color: "#fff", fontSize: 14, fontWeight: "700", lineHeight: 16 },
    categoryRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 4,
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    categoryChipText: { fontSize: 13, fontWeight: "600" },
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
