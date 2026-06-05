import { Modal, FlatList, Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { getColors } from "../shared/theme";

type TokenOption = {
    key: string;
    symbol: string;
    mint: string;
    amount: number;
    rawAmount: number;
};

type Props = {
    visible: boolean;
    options: TokenOption[];
    loading: boolean;
    onSelect: (option: TokenOption) => void;
    onClose: () => void;
};

const TOKEN_COLORS: Record<string, string> = {
    SOL:  "#9945FF",
    USDT: "#26A17B",
    ETH:  "#627EEA",
    cNGN: "#008751",
};

function TokenRow({ item, onSelect, C }: { item: TokenOption; onSelect: () => void; C: any }) {
    return (
        <Pressable
            onPress={onSelect}
            style={({ pressed }) => [
                styles.row,
                { borderBottomColor: C.border },
                pressed && { backgroundColor: C.surface },
            ]}
        >
            <View style={styles.left}>
                <View style={[styles.dot, { backgroundColor: TOKEN_COLORS[item.symbol] ?? C.accent }]} />
                <Text style={[styles.name, { color: C.text }]}>{item.symbol}</Text>
            </View>
            <Text style={[styles.amount, { color: C.textSecondary }]}>
                {item.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {item.symbol}
            </Text>
        </Pressable>
    );
}

export function TokenPicker({ visible, options, loading, onSelect, onClose }: Props) {
    const { theme } = useAppTheme();
    const C = getColors(theme);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose} />

            <View style={[styles.sheet, { backgroundColor: C.card }]}>
                {/* Handle bar */}
                <View style={[styles.handle, { backgroundColor: C.border }]} />

                <Text style={[styles.title, { color: C.text }]}>Pay with</Text>

                {loading ? (
                    <ActivityIndicator color={C.accent} style={{ marginVertical: 40 }} />
                ) : (
                    <FlatList
                        data={options}
                        keyExtractor={item => item.key}
                        scrollEnabled={false}
                        renderItem={({ item }) => (
                            <TokenRow item={item} onSelect={() => onSelect(item)} C={C} />
                        )}
                    />
                )}

                <Pressable
                    onPress={onClose}
                    style={({ pressed }) => [
                        styles.cancelBtn,
                        { backgroundColor: pressed ? C.surface : C.background },
                    ]}
                >
                    <Text style={[styles.cancelText, { color: C.textSecondary }]}>Cancel</Text>
                </Pressable>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
    },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 32,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: "center",
        marginTop: 12,
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
        paddingVertical: 16,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingVertical: 18,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    left: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    dot: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    name: {
        fontSize: 16,
        fontWeight: "600",
    },
    amount: {
        fontSize: 15,
        fontWeight: "500",
    },
    cancelBtn: {
        marginTop: 8,
        marginHorizontal: 24,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
    },
    cancelText: {
        fontSize: 15,
        fontWeight: "600",
    },
});
