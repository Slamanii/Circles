import React from 'react';
import { Modal, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";

function dividerColor(theme: string) {
    return theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";
}

function SettingsRow({ label, onPress, isLast, theme, C, right }: any) {
    return (
        <View>
            <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.6 : 1}>
                <Text style={[styles.rowText, { color: C.text }]}>{label}</Text>
                {right}
            </TouchableOpacity>
            {!isLast && <View style={[styles.divider, { backgroundColor: dividerColor(theme) }]} />}
        </View>
    );
}

export function SettingsModal({
    visible,
    closeSettings,
    toggleTheme,
    theme,
    goToInactiveScreens,
    logout,
}: any) {
    const { theme: appTheme } = useAppTheme();
    const C = getColors(appTheme);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={closeSettings}
        >
            <View style={styles.root}>
                <TouchableOpacity style={styles.overlay} onPress={closeSettings} activeOpacity={1} />

                <View style={[styles.sheet, { backgroundColor: C.background }]}>
                    <View style={styles.handle} />

                    <Text style={[styles.title, { color: C.text }]}>Profile Settings</Text>

                    {/* Card 1 — features */}
                    <View style={[styles.card, { backgroundColor: C.card }]}>
                        <SettingsRow label="QR"              onPress={() => goToInactiveScreens("QR")}      theme={appTheme} C={C} />
                        <SettingsRow label="Upgrade Account" onPress={() => goToInactiveScreens("upgrade")} theme={appTheme} C={C} />
                        <SettingsRow label="Privacy"         onPress={() => goToInactiveScreens("privacy")} theme={appTheme} C={C} />
                        <SettingsRow
                            label="Color Mode"
                            theme={appTheme}
                            C={C}
                            right={
                                <Switch
                                    value={theme === "dark"}
                                    onValueChange={toggleTheme}
                                    trackColor={{ true: "#E8622A" }}
                                />
                            }
                        />
                        <SettingsRow label="Music" onPress={() => goToInactiveScreens("music")} theme={appTheme} C={C} isLast />
                    </View>

                    {/* Card 2 — account */}
                    <View style={[styles.card, { backgroundColor: C.card }]}>
                        <SettingsRow label="Add Account"            onPress={() => goToInactiveScreens("add-account")} theme={appTheme} C={C} />
                        <SettingsRow label="Security & permissions" onPress={() => goToInactiveScreens("support")}     theme={appTheme} C={C} />
                        <SettingsRow
                            label="Logout"
                            onPress={logout}
                            isLast
                            theme={appTheme}
                            C={C}
                            right={null}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, justifyContent: "flex-end" },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 16,
        paddingBottom: 40,
        paddingTop: 12,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: "#ccc",
        alignSelf: "center",
        borderRadius: 3,
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 20,
    },
    card: {
        borderRadius: 20,
        paddingHorizontal: 16,
        marginBottom: 14,
        overflow: "hidden",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
    },
    rowText: {
        fontSize: 15,
        fontWeight: "500",
    },
    divider: {
        height: StyleSheet.hairlineWidth,
    },
});
