import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { Colors, getColors } from "../shared/theme";

const MAX_QTY = 5;

function dividerColor(theme: string) {
    return theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)";
}

const METHODS = [
    { key: "paystack", label: "Paystack" },
    { key: "wallet",   label: "Wallet" },
] as const;

export default function PaymentTerminal({ onWallet, onPaystack }: any) {
    const { theme } = useAppTheme();
    const C = getColors(theme);

    const [selected, setSelected] = useState<"paystack" | "wallet" | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const handlePayNow = async () => {
        if (!selected) return;
        setIsLoading(true);
        try {
            if (selected === "paystack") {
                await onPaystack(quantity);
            } else {
                await onWallet(quantity);
            }
        } catch (err) {
            console.error("Payment failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View>
            {/* Quantity stepper */}
            <View style={[styles.card, { backgroundColor: C.card }]}>
                <View style={styles.row}>
                    <Text style={[styles.rowLabel, { color: C.text }]}>Quantity</Text>
                    <View style={styles.stepper}>
                        <TouchableOpacity
                            onPress={() => setQuantity(q => Math.max(1, q - 1))}
                            style={[styles.stepBtn, { borderColor: C.border }]}
                        >
                            <Text style={[styles.stepText, { color: C.text }]}>−</Text>
                        </TouchableOpacity>
                        <Text style={[styles.qtyText, { color: C.text }]}>{quantity}</Text>
                        <TouchableOpacity
                            onPress={() => setQuantity(q => Math.min(MAX_QTY, q + 1))}
                            style={[styles.stepBtn, { borderColor: C.border }]}
                        >
                            <Text style={[styles.stepText, { color: C.text }]}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Payment method */}
            <View style={[styles.card, { backgroundColor: C.card }]}>
                {METHODS.map((m, i) => (
                    <View key={m.key}>
                        <TouchableOpacity
                            style={styles.row}
                            onPress={() => setSelected(m.key)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.rowLabel, { color: C.text }]}>{m.label}</Text>
                            <View style={[
                                styles.radio,
                                { borderColor: selected === m.key ? Colors.accent : C.textSecondary },
                            ]}>
                                {selected === m.key && <View style={styles.radioFill} />}
                            </View>
                        </TouchableOpacity>
                        {i < METHODS.length - 1 && (
                            <View style={[styles.divider, { backgroundColor: dividerColor(theme) }]} />
                        )}
                    </View>
                ))}
            </View>

            <TouchableOpacity
                style={[styles.payBtn, !selected && styles.payBtnDisabled]}
                onPress={handlePayNow}
                disabled={!selected || isLoading}
            >
                {isLoading
                    ? <ActivityIndicator color="white" />
                    : <Text style={styles.payText}>Pay Now</Text>
                }
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        paddingHorizontal: 16,
        marginBottom: 16,
        overflow: "hidden",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 18,
    },
    rowLabel: {
        fontSize: 15,
        fontWeight: "500",
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    radioFill: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.accent,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
    },
    payBtn: {
        backgroundColor: Colors.accent,
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: "center",
    },
    payBtnDisabled: {
        backgroundColor: "#ccc",
    },
    payText: {
        color: "white",
        fontWeight: "700",
        fontSize: 15,
    },
    stepper: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    stepBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    stepText: {
        fontSize: 18,
        lineHeight: 22,
        fontWeight: "600",
    },
    qtyText: {
        fontSize: 16,
        fontWeight: "700",
        minWidth: 20,
        textAlign: "center",
    },
});
