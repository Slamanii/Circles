import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WalletControlPanelType } from "../../../shared/Types";

type ActionBtnProps = {
    icon: React.ComponentProps<typeof Ionicons>["name"];
    label: string;
    onPress: () => void;
};

function ActionBtn({ icon, label, onPress }: ActionBtnProps) {
    return (
        <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.75}>
            <Ionicons name={icon} size={30} color="#E8622A" />
            <Text style={styles.actionLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

export function WalletControlPanel({ solDisplay, fiatDisplay, onReceive, onSend, onSwap, onBuy }: WalletControlPanelType) {
    return (
        <View style={styles.container}>
            <Text style={styles.balance}>{solDisplay}</Text>
            <Text style={styles.fiat}>{fiatDisplay}</Text>

            <View style={styles.actions}>
                <ActionBtn icon="add-outline"             label="Receive" onPress={onReceive} />
                <ActionBtn icon="arrow-up-outline"        label="Send"    onPress={onSend} />
                <ActionBtn icon="swap-horizontal-outline" label="Swap"    onPress={onSwap} />
                <ActionBtn icon="card-outline"            label="Buy"     onPress={onBuy} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 28,
        backgroundColor: "#2E2D2D",
        alignItems: "center",
    },
    balance: {
        color: "#fff",
        fontSize: 52,
        fontWeight: "900",
        letterSpacing: -2,
        marginBottom: 4,
    },
    fiat: {
        color: "#9CA3AF",
        fontSize: 20,
        fontWeight: "500",
        marginBottom: 28,
    },
    actions: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        width: "100%",
    },
    actionBtn: {
        width: 78,
        height: 54,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: "#666",
        backgroundColor: "#3D3C3C",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
    },
    actionLabel: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "700",
    },
});
