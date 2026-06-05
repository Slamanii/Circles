import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { WalletTokenRow } from "../../../components/wallet/WalletTokenRow";
import { Token } from "../../../../shared/Types";

export default function SendFormScreen({ navigation, route }: any) {
    const token: Token = route.params?.token;
    const walletAddress: string = route.params?.walletAddress ?? "";

    const [address, setAddress] = useState("");
    const [amount,  setAmount]  = useState("");

    const canContinue = address.trim().length > 30 && parseFloat(amount) > 0;

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Send {token?.symbol ?? ""}</Text>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                {/* Selected token */}
                <View style={styles.card}>
                    <WalletTokenRow token={token} />
                </View>

                {/* Recipient */}
                <Text style={styles.label}>Recipient address</Text>
                <View style={styles.inputWrap}>
                    <TextInput
                        style={styles.input}
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Wallet address"
                        placeholderTextColor="#6B7280"
                        autoCapitalize="none"
                        autoCorrect={false}
                        multiline={false}
                    />
                    {address.length > 0 && (
                        <TouchableOpacity onPress={() => setAddress("")} style={styles.clearBtn}>
                            <Ionicons name="close-circle" size={18} color="#6B7280" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Amount */}
                <Text style={styles.label}>Amount</Text>
                <View style={styles.inputWrap}>
                    <TextInput
                        style={styles.input}
                        value={amount}
                        onChangeText={setAmount}
                        placeholder="0.00"
                        placeholderTextColor="#6B7280"
                        keyboardType="decimal-pad"
                    />
                    <TouchableOpacity
                        onPress={() => setAmount(String(token?.balance ?? ""))}
                        style={styles.maxBtn}
                    >
                        <Text style={styles.maxText}>Max</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.balanceHint}>
                    Available: {token?.balance ?? 0} {token?.symbol}
                </Text>

                <TouchableOpacity
                    style={[styles.continueBtn, !canContinue && styles.disabled]}
                    onPress={() => navigation.navigate("ConfirmSend", {
                        token,
                        amount,
                        address: address.trim(),
                        walletAddress,
                    })}
                    disabled={!canContinue}
                >
                    <Text style={styles.continueText}>Review</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container:    { flex: 1, backgroundColor: "#2E2D2D" },
    backBtn:      { marginTop: 56, marginLeft: 20, marginBottom: 8 },
    backText:     { color: "#fff", fontSize: 22 },
    title:        { color: "#fff", fontSize: 22, fontWeight: "700", marginLeft: 20, marginBottom: 20 },
    content:      { paddingHorizontal: 16, paddingBottom: 60 },
    card:         { backgroundColor: "#3A3939", borderRadius: 16, marginBottom: 24, overflow: "hidden" },
    label: {
        color: "#6B7280",
        fontSize: 11,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    inputWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#3A3939",
        borderRadius: 12,
        paddingHorizontal: 14,
        marginBottom: 20,
    },
    input: {
        flex: 1,
        color: "#fff",
        fontSize: 15,
        paddingVertical: 14,
    },
    clearBtn:     { padding: 4 },
    maxBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
        backgroundColor: "#E8622A22",
    },
    maxText:      { color: "#E8622A", fontWeight: "700", fontSize: 12 },
    balanceHint:  { color: "#6B7280", fontSize: 12, marginTop: -14, marginBottom: 28 },
    continueBtn: {
        backgroundColor: "#E8622A",
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: "center",
    },
    disabled:     { opacity: 0.4 },
    continueText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
