import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { LocationPicker } from "../../components/LocationPicker";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";
import { getUser, updateProfile } from "../../services/user";
import { uploadMedia } from "../../services/upload";

function dividerColor(theme: string) {
    return theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";
}

function FieldRow({ label, value, onChangeText, multiline, isLast, theme, C }: any) {
    return (
        <View>
            <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>{label}</Text>
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    multiline={multiline}
                    style={[styles.fieldInput, { color: C.text }, multiline && styles.multiline]}
                    placeholderTextColor={C.textMuted}
                    placeholder={`Add ${label.toLowerCase()}`}
                />
            </View>
            {!isLast && <View style={[styles.divider, { backgroundColor: dividerColor(theme) }]} />}
        </View>
    );
}

export default function EditProfileScreen() {
    const navigation = useNavigation<any>();
    const { theme } = useAppTheme();
    const C = getColors(theme);

    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");
    const [link1, setLink1] = useState("");
    const [link2, setLink2] = useState("");
    const [location, setLocation] = useState("");
    const [avatar, setAvatar] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);

    useEffect(() => {
        getUser().then((u) => {
            setDisplayName(u.display_name ?? "");
            setBio(u.bio ?? "");
            setLink1(u.link_1 ?? "");
            setLink2(u.link_2 ?? "");
            setLocation(u.location ?? "");
            setAvatar(u.avatar ?? null);
        }).catch(console.error);
    }, []);

    const pickAvatar = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setAvatar(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let avatarUrl = avatar ?? undefined;
            if (avatar && (avatar.startsWith("file://") || avatar.startsWith("ph://"))) {
                avatarUrl = await uploadMedia(avatar, "avatars", "avatar.jpg", "image/jpeg");
            }
            await updateProfile({
                display_name: displayName.trim() || undefined,
                bio: bio.trim() || undefined,
                link_1: link1.trim() || undefined,
                link_2: link2.trim() || undefined,
                location: location.trim() || undefined,
                avatar: avatarUrl,
            });
            navigation.goBack();
        } catch (err: any) {
            Alert.alert("Failed to save", err.message ?? "Please try again");
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: C.background }]}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: C.text }]}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                    {saving
                        ? <ActivityIndicator color="#E8622A" />
                        : <Text style={styles.saveBtn}>Save</Text>
                    }
                </TouchableOpacity>
            </View>

            {/* Avatar */}
            <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar}>
                {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: C.surface }]}>
                        <Ionicons name="person" size={40} color={C.textSecondary} />
                    </View>
                )}
                <View style={styles.avatarBadge}>
                    <Ionicons name="camera" size={14} color="#fff" />
                </View>
            </TouchableOpacity>

            {/* Profile card */}
            <View style={[styles.card, { backgroundColor: C.card }]}>
                <FieldRow label="Display Name" value={displayName} onChangeText={setDisplayName} theme={theme} C={C} />
                <FieldRow label="Bio" value={bio} onChangeText={setBio} multiline theme={theme} C={C} />
                {/* Location row — tappable, opens full-screen city picker */}
                <View>
                    <TouchableOpacity style={styles.locationRow} onPress={() => setShowLocationPicker(true)}>
                        <View style={styles.fieldWrap}>
                            <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>Location</Text>
                            <View style={styles.locationValue}>
                                <Ionicons name="location-outline" size={14} color="#E8622A" />
                                <Text style={[styles.fieldInput, { color: location ? C.text : C.textMuted, flex: 1 }]} numberOfLines={1}>
                                    {location || "Add city"}
                                </Text>
                                <Ionicons name="chevron-forward" size={14} color={C.textSecondary} />
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={[styles.divider, { backgroundColor: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)" }]} />
                <FieldRow label="Link 1" value={link1} onChangeText={setLink1} theme={theme} C={C} />
                <FieldRow label="Link 2" value={link2} onChangeText={setLink2} theme={theme} C={C} isLast />
            </View>

            <LocationPicker
                visible={showLocationPicker}
                onClose={() => setShowLocationPicker(false)}
                onSelect={(city) => setLocation(city)}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingBottom: 60 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 56,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    title: { fontSize: 17, fontWeight: "700" },
    saveBtn: { color: "#E8622A", fontSize: 16, fontWeight: "700" },
    avatarWrap: {
        alignSelf: "center",
        marginBottom: 28,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
    },
    avatarPlaceholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    avatarBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#E8622A",
        alignItems: "center",
        justifyContent: "center",
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginLeft: 20,
        marginBottom: 6,
        marginTop: 4,
    },
    card: {
        borderRadius: 20,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        overflow: "hidden",
    },
    fieldWrap: {
        paddingVertical: 14,
        gap: 4,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: "600",
    },
    fieldInput: {
        fontSize: 15,
        paddingVertical: 2,
    },
    multiline: {
        minHeight: 60,
        textAlignVertical: "top",
    },
    divider: {
        height: StyleSheet.hairlineWidth,
    },
    locationRow: {
        paddingVertical: 14,
    },
    locationValue: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingTop: 2,
    },
});
