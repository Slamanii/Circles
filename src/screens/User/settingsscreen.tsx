import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";
import { updateProfile } from "../../services/user";

function dividerColor(theme: string) {
    return theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";
}

function SettingsRow({ label, onPress, isLast, theme, C, right }: any) {
    return (
        <View>
            <TouchableOpacity
                style={styles.row}
                onPress={onPress}
                activeOpacity={onPress ? 0.6 : 1}
            >
                <Text style={[styles.rowText, { color: C.text }]}>{label}</Text>
                {right ?? <Ionicons name="chevron-forward" size={16} color={C.textSecondary} />}
            </TouchableOpacity>
            {!isLast && <View style={[styles.divider, { backgroundColor: dividerColor(theme) }]} />}
        </View>
    );
}

export default function SettingsScreen() {
    const navigation = useNavigation<any>();
    const { theme, toggleTheme } = useAppTheme();
    const C = getColors(theme);
    const [isPrivate, setIsPrivate] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem("user")
            .then(raw => raw ? setIsPrivate(JSON.parse(raw).private ?? false) : null)
            .catch(() => {});
    }, []);

    const togglePrivate = async (value: boolean) => {
        setIsPrivate(value);
        try {
            await updateProfile({ private: value });
            const raw = await AsyncStorage.getItem("user");
            if (raw) {
                const user = JSON.parse(raw);
                await AsyncStorage.setItem("user", JSON.stringify({ ...user, private: value }));
            }
        } catch {
            setIsPrivate(!value); // revert on failure
        }
    };

    const logout = async () => {
        await AsyncStorage.multiRemove(["token", "user", "active_wallet"]);
        navigation.replace("login" as never);
    };

    return (
        <View style={[styles.container, { backgroundColor: C.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: C.background }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={C.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: C.text }]}>Profile Settings</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Card 1 — profile + features */}
                <View style={[styles.card, { backgroundColor: C.card }]}>
                    <SettingsRow
                        label="Edit Profile"
                        onPress={() => navigation.navigate("EditProfile")}
                        theme={theme} C={C}
                    />
                    <SettingsRow
                        label="QR Code"
                        onPress={() => {}}
                        theme={theme} C={C}
                    />
                    <SettingsRow
                        label="Upgrade Account"
                        onPress={() => {}}
                        theme={theme} C={C}
                    />
                    <SettingsRow
                        label="Private Account"
                        theme={theme} C={C}
                        right={
                            <Switch
                                value={isPrivate}
                                onValueChange={togglePrivate}
                                trackColor={{ true: "#E8622A" }}
                            />
                        }
                    />
                    <SettingsRow
                        label="Color Mode"
                        theme={theme} C={C}
                        right={
                            <Switch
                                value={theme === "dark"}
                                onValueChange={toggleTheme}
                                trackColor={{ true: "#E8622A" }}
                            />
                        }
                    />
                    <SettingsRow
                        label="Music"
                        onPress={() => {}}
                        theme={theme} C={C}
                        isLast
                    />
                </View>

                {/* Card 2 — account */}
                <View style={[styles.card, { backgroundColor: C.card }]}>
                    <SettingsRow
                        label="Add Account"
                        onPress={() => {}}
                        theme={theme} C={C}
                    />
                    <SettingsRow
                        label="Security & Permissions"
                        onPress={() => {}}
                        theme={theme} C={C}
                    />
                    <SettingsRow
                        label="Logout"
                        onPress={logout}
                        isLast
                        theme={theme} C={C}
                        right={<Ionicons name="log-out-outline" size={18} color="#EF4444" />}
                    />
                </View>
            </ScrollView>
        </View>
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
        paddingBottom: 16,
    },
    backBtn: { width: 36, height: 36, justifyContent: "center" },
    title: { fontSize: 17, fontWeight: "700" },
    content: { paddingTop: 8, paddingBottom: 60 },
    card: {
        borderRadius: 20,
        marginHorizontal: 16,
        marginBottom: 14,
        paddingHorizontal: 16,
        overflow: "hidden",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
    },
    rowText: { fontSize: 15, fontWeight: "500" },
    divider: { height: StyleSheet.hairlineWidth },
});
