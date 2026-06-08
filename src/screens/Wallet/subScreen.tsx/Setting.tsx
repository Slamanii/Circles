import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    authenticate,
    getBiometricEnabled,
    isBiometricAvailable,
    setBiometricEnabled,
} from "../../../services/biometric";
import {
    Currency,
    CURRENCY_LABELS,
    getPreferredCurrency,
    setPreferredCurrency,
} from "../../../services/currency";

const BG      = "#2E2D2D";
const SURFACE = "#3A3939";
const BORDER  = "#4A4949";
const TEXT    = "#FFFFFF";
const MUTED   = "#9CA3AF";
const ACCENT  = "#E8622A";

const CURRENCIES: Currency[] = ["USD", "NGN"];

function SectionHeader({ label }: { label: string }) {
    return <Text style={styles.sectionHeader}>{label}</Text>;
}

function SettingRow({
    icon,
    label,
    sublabel,
    right,
    onPress,
    isLast = false,
}: {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    label: string;
    sublabel?: string;
    right?: React.ReactNode;
    onPress?: () => void;
    isLast?: boolean;
}) {
    return (
        <>
            <TouchableOpacity
                style={styles.row}
                onPress={onPress}
                activeOpacity={onPress ? 0.6 : 1}
                disabled={!onPress && !right}
            >
                <View style={styles.rowIcon}>
                    <Ionicons name={icon} size={18} color={MUTED} />
                </View>
                <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>{label}</Text>
                    {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
                </View>
                <View style={styles.rowRight}>
                    {right ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={MUTED} /> : null)}
                </View>
            </TouchableOpacity>
            {!isLast && <View style={styles.divider} />}
        </>
    );
}

function CurrencyModal({
    visible,
    selected,
    onSelect,
    onClose,
}: {
    visible: boolean;
    selected: Currency;
    onSelect: (c: Currency) => void;
    onClose: () => void;
}) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalBackdrop} onPress={onClose}>
                <Pressable style={styles.modalSheet} onPress={() => {}}>
                    <View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}>Preferred Currency</Text>
                    <Text style={styles.modalHint}>
                        Controls the fiat equivalent shown below your token balance.
                    </Text>
                    {CURRENCIES.map((c, i) => (
                        <View key={c}>
                            <TouchableOpacity
                                style={styles.modalRow}
                                onPress={() => onSelect(c)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.modalRowLabel}>{CURRENCY_LABELS[c]}</Text>
                                {selected === c && (
                                    <Ionicons name="checkmark" size={20} color={ACCENT} />
                                )}
                            </TouchableOpacity>
                            {i < CURRENCIES.length - 1 && (
                                <View style={[styles.divider, { marginLeft: 0 }]} />
                            )}
                        </View>
                    ))}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

export default function WalletSettingsScreen() {
    const navigation = useNavigation<any>();

    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabledState] = useState(false);
    const [togglingBiometric, setTogglingBiometric] = useState(false);

    const [currency, setCurrency] = useState<Currency>("USD");
    const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

    useEffect(() => {
        async function load() {
            const [available, cur] = await Promise.all([
                isBiometricAvailable(),
                getPreferredCurrency(),
            ]);
            setBiometricAvailable(available);
            if (available) {
                const enabled = await getBiometricEnabled();
                setBiometricEnabledState(enabled);
            }
            setCurrency(cur);
        }
        load();
    }, []);

    const handleBiometricToggle = async (value: boolean) => {
        if (togglingBiometric) return;
        setTogglingBiometric(true);
        try {
            const passed = await authenticate(
                value ? "Enable biometric lock" : "Disable biometric lock"
            );
            if (!passed) return;
            await setBiometricEnabled(value);
            setBiometricEnabledState(value);
        } catch {
            Alert.alert("Error", "Could not update biometric setting.");
        } finally {
            setTogglingBiometric(false);
        }
    };

    const handleCurrencySelect = async (c: Currency) => {
        await setPreferredCurrency(c);
        setCurrency(c);
        setCurrencyModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={TEXT} />
                </TouchableOpacity>
                <Text style={styles.title}>Wallet Settings</Text>
                <View style={styles.backBtn} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
            >
                {/* Security */}
                <SectionHeader label="SECURITY" />
                <View style={styles.card}>
                    {biometricAvailable ? (
                        <SettingRow
                            icon="finger-print-outline"
                            label="Biometric Lock"
                            sublabel="Require Face ID / fingerprint to open wallet"
                            right={
                                <Switch
                                    value={biometricEnabled}
                                    onValueChange={handleBiometricToggle}
                                    trackColor={{ false: BORDER, true: ACCENT }}
                                    thumbColor={TEXT}
                                    disabled={togglingBiometric}
                                />
                            }
                            isLast
                        />
                    ) : (
                        <SettingRow
                            icon="finger-print-outline"
                            label="Biometric Lock"
                            sublabel="Not available on this device"
                            isLast
                        />
                    )}
                </View>

                {/* Keys */}
                <SectionHeader label="KEYS" />
                <View style={styles.card}>
                    <SettingRow
                        icon="key-outline"
                        label="Export Private Key"
                        sublabel="View and back up your custodial wallet key"
                        onPress={() => {/* TODO: export key screen */}}
                    />
                    <SettingRow
                        icon="swap-horizontal-outline"
                        label="Switch Wallet"
                        sublabel="Connect Phantom or change active wallet"
                        onPress={() => {/* TODO: wallet switch screen */}}
                        isLast
                    />
                </View>

                {/* Preferences */}
                <SectionHeader label="PREFERENCES" />
                <View style={styles.card}>
                    <SettingRow
                        icon="cash-outline"
                        label="Preferred Currency"
                        sublabel={currency}
                        onPress={() => setCurrencyModalVisible(true)}
                    />
                    <SettingRow
                        icon="eye-off-outline"
                        label="Hide Balance"
                        sublabel="Mask balance on wallet home"
                        right={
                            <Switch
                                value={false}
                                trackColor={{ false: BORDER, true: ACCENT }}
                                thumbColor={TEXT}
                                disabled
                            />
                        }
                        isLast
                    />
                </View>
            </ScrollView>

            <CurrencyModal
                visible={currencyModalVisible}
                selected={currency}
                onSelect={handleCurrencySelect}
                onClose={() => setCurrencyModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 56,
        paddingBottom: 16,
        paddingHorizontal: 8,
        backgroundColor: BG,
    },
    backBtn:  { width: 40, alignItems: "center" },
    title:    { fontSize: 17, fontWeight: "600", color: TEXT },
    scroll:   { paddingHorizontal: 16, paddingBottom: 48 },
    sectionHeader: {
        fontSize: 11,
        fontWeight: "600",
        color: MUTED,
        letterSpacing: 0.8,
        marginTop: 28,
        marginBottom: 8,
        marginLeft: 4,
    },
    card:     { backgroundColor: SURFACE, borderRadius: 14, overflow: "hidden" },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        minHeight: 56,
    },
    rowIcon:     { width: 32, alignItems: "center" },
    rowText:     { flex: 1, marginLeft: 10 },
    rowLabel:    { fontSize: 15, color: TEXT, fontWeight: "500" },
    rowSublabel: { fontSize: 12, color: MUTED, marginTop: 2 },
    rowRight:    { marginLeft: 8 },
    divider:     { height: StyleSheet.hairlineWidth, backgroundColor: BORDER, marginLeft: 58 },

    // Modal
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
    },
    modalSheet: {
        backgroundColor: SURFACE,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 12,
    },
    modalHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: BORDER,
        alignSelf: "center",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: TEXT,
        marginBottom: 6,
    },
    modalHint: {
        fontSize: 13,
        color: MUTED,
        marginBottom: 20,
        lineHeight: 18,
    },
    modalRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 18,
    },
    modalRowLabel: { fontSize: 15, color: TEXT, fontWeight: "500" },
});
