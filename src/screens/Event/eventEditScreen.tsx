import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../context/ThemeContext";
import { Colors, getColors } from "../../shared/theme";
import { addCollaborator, cancelEvent, editEvent, fetchScanGrants, getEventById, grantScanAccess, removeCollaborator, revokeScanAccess } from "../../services/eventService";
import { searchUsers, UserSummary } from "../../services/user";

function dividerColor(theme: string) {
    return theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";
}

export default function EventEditScreen({ route }: any) {
    const { eventId } = route.params as { eventId: string };
    const navigation = useNavigation<any>();
    const { theme } = useAppTheme();
    const C = getColors(theme);

    const GUEST_SLOTS = 15;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [venue, setVenue] = useState("");
    const [eventDate, setEventDate] = useState<Date | null>(null);
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
    const [guestNames, setGuestNames] = useState<string[]>(Array(GUEST_SLOTS).fill(""));

    const [isCancelled, setIsCancelled] = useState(false);
    const [cancelNotice, setCancelNotice] = useState("");
    const [cancelling, setCancelling] = useState(false);

    const [collaborators, setCollaborators] = useState<UserSummary[]>([]);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<UserSummary[]>([]);
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [scanGrants, setScanGrants] = useState<UserSummary[]>([]);
    const [scanQuery, setScanQuery] = useState("");
    const [scanResults, setScanResults] = useState<UserSummary[]>([]);
    const [scanSearching, setScanSearching] = useState(false);
    const scanDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        getEventById(eventId)
            .then((event: any) => {
                setVenue(event.venue ?? "");
                setEventDate(event.event_date ? new Date(event.event_date) : null);
                const names = (event.guest_list ?? "").split("\n").filter(Boolean);
                const slots = Array(GUEST_SLOTS).fill("");
                names.slice(0, GUEST_SLOTS).forEach((n: string, i: number) => { slots[i] = n; });
                setGuestNames(slots);
                setCollaborators(event.collaborators ?? []);
                setIsCancelled(event.status === "cancelled");
            })
            .catch((err) => Alert.alert("Failed to load event", err instanceof Error ? err.message : "Please try again"))
            .finally(() => setLoading(false));
        fetchScanGrants(eventId).then((g: any) => setScanGrants(g ?? [])).catch(() => {});
    }, [eventId]);

    const setGuestName = (index: number, value: string) => {
        setGuestNames(prev => prev.map((n, i) => i === index ? value : n));
    };

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query.trim()) { setResults([]); return; }
        debounceRef.current = setTimeout(() => {
            setSearching(true);
            searchUsers(query.trim())
                .then((res) => setResults(res.filter(u => !collaborators.some(c => c.id === u.id))))
                .catch(() => setResults([]))
                .finally(() => setSearching(false));
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, collaborators]);

    const handleAddCollaborator = async (user: UserSummary) => {
        try {
            await addCollaborator(eventId, user.id);
            setCollaborators(prev => [...prev, user]);
            setQuery("");
            setResults([]);
        } catch (err) {
            Alert.alert("Couldn't add collaborator", err instanceof Error ? err.message : "Please try again");
        }
    };

    const handleRemoveCollaborator = async (userId: string) => {
        try {
            await removeCollaborator(eventId, userId);
            setCollaborators(prev => prev.filter(c => c.id !== userId));
        } catch (err) {
            Alert.alert("Couldn't remove collaborator", err instanceof Error ? err.message : "Please try again");
        }
    };

    useEffect(() => {
        if (scanDebounceRef.current) clearTimeout(scanDebounceRef.current);
        if (!scanQuery.trim()) { setScanResults([]); return; }
        scanDebounceRef.current = setTimeout(() => {
            setScanSearching(true);
            searchUsers(scanQuery.trim())
                .then((res) => setScanResults(res.filter(u => !scanGrants.some(g => g.id === u.id))))
                .catch(() => setScanResults([]))
                .finally(() => setScanSearching(false));
        }, 300);
        return () => { if (scanDebounceRef.current) clearTimeout(scanDebounceRef.current); };
    }, [scanQuery, scanGrants]);

    const handleAddScanGrant = async (user: UserSummary) => {
        try {
            await grantScanAccess(eventId, user.id);
            setScanGrants(prev => [...prev, user]);
            setScanQuery("");
            setScanResults([]);
        } catch (err) {
            Alert.alert("Couldn't grant scan access", err instanceof Error ? err.message : "Please try again");
        }
    };

    const handleRemoveScanGrant = async (userId: string) => {
        try {
            await revokeScanAccess(eventId, userId);
            setScanGrants(prev => prev.filter(g => g.id !== userId));
        } catch (err) {
            Alert.alert("Couldn't revoke scan access", err instanceof Error ? err.message : "Please try again");
        }
    };

    const handleCancelEvent = () => {
        if (!cancelNotice.trim()) {
            Alert.alert("Compensation notice required", "Explain how attendees will be compensated or refunded before cancelling.");
            return;
        }
        Alert.alert(
            "Cancel this event?",
            "This cannot be undone. The event and every ticket to it stay visible, but no further purchases, scans, or edits will be possible.",
            [
                { text: "Back", style: "cancel" },
                {
                    text: "Cancel Event", style: "destructive", onPress: async () => {
                        setCancelling(true);
                        try {
                            await cancelEvent(eventId, cancelNotice.trim());
                            setIsCancelled(true);
                            Alert.alert("Event cancelled", "Ticket holders have been notified.", [
                                { text: "OK", onPress: () => navigation.goBack() },
                            ]);
                        } catch (err) {
                            Alert.alert("Failed to cancel event", err instanceof Error ? err.message : "Please try again");
                        } finally {
                            setCancelling(false);
                        }
                    },
                },
            ],
        );
    };

    const handleSave = async () => {
        if (!venue.trim() || !eventDate) return;
        setSaving(true);
        try {
            const guestList = guestNames.map(n => n.trim()).filter(Boolean).join("\n");
            await editEvent(eventId, { venue: venue.trim(), eventDate: eventDate.toISOString(), guestList });
            Alert.alert("Saved", "Ticket holders have been notified.", [
                { text: "OK", onPress: () => navigation.goBack() },
            ]);
        } catch (err) {
            Alert.alert("Failed to save", err instanceof Error ? err.message : "Please try again");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: C.background }]}>
                <ActivityIndicator color={C.textSecondary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: C.background }]}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: C.text }]}>Edit Event</Text>
                <View style={{ width: 24 }} />
            </View>

            <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>Date & Venue</Text>
            <View style={[styles.card, { backgroundColor: C.card }]}>
                <TouchableOpacity onPress={() => { setPickerMode("date"); setShowPicker(true); }} style={styles.fieldInput}>
                    <Text style={{ color: eventDate ? C.text : C.textSecondary, fontSize: 15 }}>
                        {eventDate ? eventDate.toLocaleString() : "Date"}
                    </Text>
                </TouchableOpacity>
                <View style={[styles.divider, { backgroundColor: dividerColor(theme) }]} />
                <TextInput
                    placeholder="Venue Name"
                    placeholderTextColor={C.textSecondary}
                    value={venue}
                    onChangeText={setVenue}
                    style={[styles.fieldInput, { color: C.text }]}
                />
            </View>
            <Text style={[styles.hint, { color: C.textSecondary }]}>
                Anyone who already holds a ticket to this event will be notified of the change.
            </Text>

            <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>Guest List (up to 15)</Text>
            <View style={[styles.card, { backgroundColor: C.card }]}>
                {guestNames.map((name, i) => (
                    <View key={i}>
                        <TextInput
                            placeholder={`Guest ${i + 1}`}
                            placeholderTextColor={C.textSecondary}
                            value={name}
                            onChangeText={(t) => setGuestName(i, t)}
                            style={[styles.fieldInput, { color: C.text }]}
                        />
                        {i < guestNames.length - 1 && (
                            <View style={[styles.divider, { backgroundColor: dividerColor(theme) }]} />
                        )}
                    </View>
                ))}
            </View>

            <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>Collaborators</Text>
            <View style={[styles.card, { backgroundColor: C.card }]}>
                {collaborators.map((c) => (
                    <View key={c.id} style={styles.collabRow}>
                        {c.avatar ? (
                            <Image source={{ uri: c.avatar }} style={styles.collabAvatar} />
                        ) : (
                            <View style={[styles.collabAvatar, { backgroundColor: C.surface }]} />
                        )}
                        <Text style={[styles.collabName, { color: C.text }]} numberOfLines={1}>{c.username}</Text>
                        <TouchableOpacity onPress={() => handleRemoveCollaborator(c.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="close-circle" size={20} color={C.textSecondary} />
                        </TouchableOpacity>
                    </View>
                ))}
                {collaborators.length > 0 && (
                    <View style={[styles.divider, { backgroundColor: dividerColor(theme) }]} />
                )}
                <TextInput
                    placeholder="Search by username"
                    placeholderTextColor={C.textSecondary}
                    value={query}
                    onChangeText={setQuery}
                    style={[styles.fieldInput, { color: C.text }]}
                    autoCapitalize="none"
                />
            </View>
            {searching && <ActivityIndicator style={{ marginTop: -4, marginBottom: 12 }} color={C.textSecondary} />}
            {results.length > 0 && (
                <View style={[styles.card, { backgroundColor: C.card }]}>
                    {results.map((u) => (
                        <TouchableOpacity key={u.id} style={styles.collabRow} onPress={() => handleAddCollaborator(u)}>
                            {u.avatar ? (
                                <Image source={{ uri: u.avatar }} style={styles.collabAvatar} />
                            ) : (
                                <View style={[styles.collabAvatar, { backgroundColor: C.surface }]} />
                            )}
                            <Text style={[styles.collabName, { color: C.text }]} numberOfLines={1}>{u.username}</Text>
                            <Ionicons name="add-circle-outline" size={20} color={C.accentText} />
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            <Text style={[styles.hint, { color: C.textSecondary }]}>
                Collaborators show up on the event page as decorative credit — they get no edit access.
            </Text>

            <Text style={[styles.sectionLabel, { color: C.textSecondary }]}>Scan Access</Text>
            <View style={[styles.card, { backgroundColor: C.card }]}>
                {scanGrants.map((g) => (
                    <View key={g.id} style={styles.collabRow}>
                        {g.avatar ? (
                            <Image source={{ uri: g.avatar }} style={styles.collabAvatar} />
                        ) : (
                            <View style={[styles.collabAvatar, { backgroundColor: C.surface }]} />
                        )}
                        <Text style={[styles.collabName, { color: C.text }]} numberOfLines={1}>{g.username}</Text>
                        <TouchableOpacity onPress={() => handleRemoveScanGrant(g.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="close-circle" size={20} color={C.textSecondary} />
                        </TouchableOpacity>
                    </View>
                ))}
                {scanGrants.length > 0 && (
                    <View style={[styles.divider, { backgroundColor: dividerColor(theme) }]} />
                )}
                <TextInput
                    placeholder="Search by username"
                    placeholderTextColor={C.textSecondary}
                    value={scanQuery}
                    onChangeText={setScanQuery}
                    style={[styles.fieldInput, { color: C.text }]}
                    autoCapitalize="none"
                />
            </View>
            {scanSearching && <ActivityIndicator style={{ marginTop: -4, marginBottom: 12 }} color={C.textSecondary} />}
            {scanResults.length > 0 && (
                <View style={[styles.card, { backgroundColor: C.card }]}>
                    {scanResults.map((u) => (
                        <TouchableOpacity key={u.id} style={styles.collabRow} onPress={() => handleAddScanGrant(u)}>
                            {u.avatar ? (
                                <Image source={{ uri: u.avatar }} style={styles.collabAvatar} />
                            ) : (
                                <View style={[styles.collabAvatar, { backgroundColor: C.surface }]} />
                            )}
                            <Text style={[styles.collabName, { color: C.text }]} numberOfLines={1}>{u.username}</Text>
                            <Ionicons name="add-circle-outline" size={20} color={C.accentText} />
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            <Text style={[styles.hint, { color: C.textSecondary }]}>
                Anyone granted scan access can check tickets in at the door, alongside you.
            </Text>

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
                style={[styles.submitBtn, (!venue.trim() || !eventDate || saving) && styles.submitBtnDisabled]}
                onPress={handleSave}
                disabled={!venue.trim() || !eventDate || saving}
            >
                {saving
                    ? <ActivityIndicator color={Colors.black} />
                    : <Text style={[styles.submitText, { color: Colors.black }]}>Save Changes</Text>
                }
            </TouchableOpacity>

            <Text style={[styles.sectionLabel, styles.dangerLabel]}>Cancel Event</Text>
            {isCancelled ? (
                <View style={[styles.card, { backgroundColor: C.card }]}>
                    <Text style={[styles.hint, { marginBottom: 0, paddingVertical: 18 }]}>
                        This event is cancelled. No further purchases, scans, or edits are possible.
                    </Text>
                </View>
            ) : (
                <>
                    <View style={[styles.card, { backgroundColor: C.card }]}>
                        <TextInput
                            placeholder="Compensation / refund notice shown to ticket holders"
                            placeholderTextColor={C.textSecondary}
                            value={cancelNotice}
                            onChangeText={setCancelNotice}
                            style={[styles.fieldInput, { color: C.text }]}
                            multiline
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.cancelBtn, (!cancelNotice.trim() || cancelling) && styles.submitBtnDisabled]}
                        onPress={handleCancelEvent}
                        disabled={!cancelNotice.trim() || cancelling}
                    >
                        {cancelling
                            ? <ActivityIndicator color="white" />
                            : <Text style={[styles.submitText, { color: "white" }]}>Cancel Event</Text>
                        }
                    </TouchableOpacity>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { alignItems: "center", justifyContent: "center" },
    content: { padding: 20, paddingTop: 56, paddingBottom: 60 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    headerTitle: { fontSize: 17, fontWeight: "700" },
    card: {
        borderRadius: 20,
        paddingHorizontal: 20,
        marginBottom: 8,
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
    hint: {
        fontSize: 12,
        marginBottom: 24,
        marginLeft: 4,
    },
    collabRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 12,
    },
    collabAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    collabName: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    submitBtn: {
        marginTop: 8,
        backgroundColor: Colors.accent,
        padding: 16,
        borderRadius: 14,
        alignItems: "center",
    },
    submitBtnDisabled: { backgroundColor: "#ccc" },
    submitText: { fontWeight: "700", fontSize: 15 },
    dangerLabel: { color: "#D64545", marginTop: 32 },
    cancelBtn: {
        marginTop: 8,
        backgroundColor: "#D64545",
        padding: 16,
        borderRadius: 14,
        alignItems: "center",
    },
});
