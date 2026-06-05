import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    FlatList,
    Keyboard,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { DateRange, PriceRange } from "../hooks/useEventFilter";
import { Colors, getColors, Radius } from "../shared/theme";

export type FilterSheetType = "date" | "price" | "location";

type Props = {
    visible: boolean;
    type: FilterSheetType | null;
    dateRange: DateRange;
    onDateChange: (r: DateRange) => void;
    priceRange: PriceRange;
    onPriceChange: (r: PriceRange) => void;
    locations: string[];
    selectedLocation: string | null;
    onLocationSelect: (loc: string | null) => void;
    onClose: () => void;
    onClear: () => void;
};

const TITLES: Record<FilterSheetType, string> = {
    date:     "Date Range",
    price:    "Price Range",
    location: "Location",
};

export default function FilterSheet({
    visible, type,
    dateRange, onDateChange,
    priceRange, onPriceChange,
    locations, selectedLocation, onLocationSelect,
    onClose, onClear,
}: Props) {
    const C = getColors(useAppTheme().theme);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>

                <View style={[styles.sheet, { backgroundColor: C.card }]}>
                    <View style={[styles.handle, { backgroundColor: C.border }]} />

                    <View style={styles.header}>
                        <Text style={[styles.title, { color: C.text }]}>
                            {type ? TITLES[type] : ""}
                        </Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={22} color={C.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {type === "date" && (
                        <DateContent C={C} dateRange={dateRange} onDateChange={onDateChange} />
                    )}
                    {type === "price" && (
                        <PriceContent
                            C={C}
                            priceRange={priceRange}
                            onPriceChange={onPriceChange}
                            onApply={onClose}
                        />
                    )}
                    {type === "location" && (
                        <LocationContent
                            C={C}
                            locations={locations}
                            selectedLocation={selectedLocation}
                            onSelect={(loc) => { onLocationSelect(loc); onClose(); }}
                        />
                    )}

                    <TouchableOpacity
                        style={[styles.clearBtn, { borderColor: C.border }]}
                        onPress={() => { onClear(); onClose(); }}
                    >
                        <Text style={[styles.clearText, { color: C.textSecondary }]}>Clear filter</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── Date content ────────────────────────────────────────────────────────────

function DateContent({ C, dateRange, onDateChange }: {
    C: any;
    dateRange: DateRange;
    onDateChange: (r: DateRange) => void;
}) {
    const [picking, setPicking] = useState<"from" | "to" | null>(null);

    const showAndroidPicker = (field: "from" | "to") => setPicking(field);

    const handleChange = (_: any, date?: Date) => {
        if (!date || !picking) return;
        onDateChange(
            picking === "from"
                ? { ...dateRange, from: date }
                : { ...dateRange, to: date }
        );
        if (Platform.OS === "android") setPicking(null);
    };

    const fmt = (d: Date | null) =>
        d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Any";

    return (
        <View style={styles.sectionPad}>
            <DateRow
                label="From"
                value={fmt(dateRange.from)}
                C={C}
                onPress={() => Platform.OS === "android" ? showAndroidPicker("from") : setPicking(picking === "from" ? null : "from")}
                active={picking === "from"}
            />
            {(Platform.OS === "ios" && picking === "from") && (
                <DateTimePicker
                    value={dateRange.from ?? new Date()}
                    mode="date"
                    display="inline"
                    maximumDate={dateRange.to ?? undefined}
                    onChange={handleChange}
                    style={styles.iosPicker}
                />
            )}
            {(Platform.OS === "android" && picking === "from") && (
                <DateTimePicker
                    value={dateRange.from ?? new Date()}
                    mode="date"
                    display="default"
                    maximumDate={dateRange.to ?? undefined}
                    onChange={handleChange}
                />
            )}

            <DateRow
                label="To"
                value={fmt(dateRange.to)}
                C={C}
                onPress={() => Platform.OS === "android" ? showAndroidPicker("to") : setPicking(picking === "to" ? null : "to")}
                active={picking === "to"}
            />
            {(Platform.OS === "ios" && picking === "to") && (
                <DateTimePicker
                    value={dateRange.to ?? new Date()}
                    mode="date"
                    display="inline"
                    minimumDate={dateRange.from ?? undefined}
                    onChange={handleChange}
                    style={styles.iosPicker}
                />
            )}
            {(Platform.OS === "android" && picking === "to") && (
                <DateTimePicker
                    value={dateRange.to ?? new Date()}
                    mode="date"
                    display="default"
                    minimumDate={dateRange.from ?? undefined}
                    onChange={handleChange}
                />
            )}
        </View>
    );
}

function DateRow({ label, value, C, onPress, active }: {
    label: string; value: string; C: any; onPress: () => void; active: boolean;
}) {
    return (
        <TouchableOpacity
            style={[styles.dateRow, { backgroundColor: C.surface, borderColor: active ? Colors.accent : C.border }]}
            onPress={onPress}
            activeOpacity={0.75}
        >
            <Text style={[styles.dateLabel, { color: C.textSecondary }]}>{label}</Text>
            <Text style={[styles.dateValue, { color: active ? Colors.accent : C.text }]}>{value}</Text>
            <Ionicons name="calendar-outline" size={18} color={active ? Colors.accent : C.textSecondary} />
        </TouchableOpacity>
    );
}

// ─── Price content ────────────────────────────────────────────────────────────

function PriceContent({ C, priceRange, onPriceChange, onApply }: {
    C: any;
    priceRange: PriceRange;
    onPriceChange: (r: PriceRange) => void;
    onApply: () => void;
}) {
    const [minStr, setMinStr] = useState(priceRange.min?.toString() ?? "");
    const [maxStr, setMaxStr] = useState(priceRange.max?.toString() ?? "");

    useEffect(() => {
        setMinStr(priceRange.min?.toString() ?? "");
        setMaxStr(priceRange.max?.toString() ?? "");
    }, [priceRange]);

    const apply = () => {
        const min = minStr.trim() ? parseFloat(minStr) : null;
        const max = maxStr.trim() ? parseFloat(maxStr) : null;
        onPriceChange({
            min: min !== null && !isNaN(min) ? min : null,
            max: max !== null && !isNaN(max) ? max : null,
        });
        Keyboard.dismiss();
        onApply();
    };

    return (
        <View style={styles.sectionPad}>
            <View style={styles.priceRow}>
                <View style={styles.priceInputWrap}>
                    <Text style={[styles.dateLabel, { color: C.textSecondary }]}>Min (₦)</Text>
                    <TextInput
                        style={[styles.priceInput, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                        value={minStr}
                        onChangeText={setMinStr}
                        placeholder="0"
                        placeholderTextColor={C.textMuted}
                        keyboardType="numeric"
                        returnKeyType="next"
                    />
                </View>

                <Text style={[styles.priceSep, { color: C.textMuted }]}>—</Text>

                <View style={styles.priceInputWrap}>
                    <Text style={[styles.dateLabel, { color: C.textSecondary }]}>Max (₦)</Text>
                    <TextInput
                        style={[styles.priceInput, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                        value={maxStr}
                        onChangeText={setMaxStr}
                        placeholder="Any"
                        placeholderTextColor={C.textMuted}
                        keyboardType="numeric"
                        returnKeyType="done"
                        onSubmitEditing={apply}
                    />
                </View>
            </View>

            <TouchableOpacity style={styles.applyBtn} onPress={apply}>
                <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Location content ─────────────────────────────────────────────────────────

function LocationContent({ C, locations, selectedLocation, onSelect }: {
    C: any;
    locations: string[];
    selectedLocation: string | null;
    onSelect: (loc: string | null) => void;
}) {
    if (locations.length === 0) {
        return (
            <View style={[styles.sectionPad, styles.empty]}>
                <Text style={{ color: C.textMuted, fontSize: 14 }}>No locations available</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={locations}
            keyExtractor={l => l}
            style={styles.locationList}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
                const active = item === selectedLocation;
                return (
                    <TouchableOpacity
                        style={[styles.locationRow, { borderBottomColor: C.border }]}
                        onPress={() => onSelect(active ? null : item)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.locationText, { color: active ? Colors.accent : C.text }]}>
                            {item}
                        </Text>
                        {active && <Ionicons name="checkmark" size={18} color={Colors.accent} />}
                    </TouchableOpacity>
                );
            }}
        />
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 36,
        maxHeight: "85%",
    },
    handle: {
        width: 38,
        height: 4,
        borderRadius: 2,
        alignSelf: "center",
        marginTop: 10,
        marginBottom: 4,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    title: {
        fontSize: 17,
        fontWeight: "700",
    },
    sectionPad: {
        paddingHorizontal: 20,
        paddingTop: 4,
    },
    // date
    dateRow: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: Radius.md,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 13,
        marginBottom: 12,
        gap: 10,
    },
    dateLabel: {
        fontSize: 13,
        fontWeight: "600",
        width: 38,
    },
    dateValue: {
        flex: 1,
        fontSize: 15,
        fontWeight: "500",
    },
    iosPicker: {
        marginBottom: 12,
    },
    // price
    priceRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 12,
        marginBottom: 20,
    },
    priceInputWrap: {
        flex: 1,
        gap: 6,
    },
    priceInput: {
        borderRadius: Radius.md,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        fontWeight: "500",
    },
    priceSep: {
        fontSize: 20,
        fontWeight: "300",
        paddingBottom: 12,
    },
    applyBtn: {
        backgroundColor: Colors.accent,
        borderRadius: Radius.md,
        paddingVertical: 14,
        alignItems: "center",
    },
    applyText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
    },
    // location
    locationList: {
        maxHeight: 280,
        paddingHorizontal: 20,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    locationText: {
        fontSize: 15,
        fontWeight: "500",
    },
    empty: {
        alignItems: "center",
        paddingVertical: 32,
    },
    // clear
    clearBtn: {
        marginHorizontal: 20,
        marginTop: 16,
        borderWidth: 1,
        borderRadius: Radius.md,
        paddingVertical: 13,
        alignItems: "center",
    },
    clearText: {
        fontSize: 14,
        fontWeight: "600",
    },
});
