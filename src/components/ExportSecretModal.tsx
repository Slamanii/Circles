import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ExportSecretModal({
    visible,
    secret,
    format,
    onClose,
}: {
    visible: boolean;
    secret: string | null;
    format: "mnemonic" | "legacy_key" | null;
    onClose: () => void;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!secret) return;
        await Clipboard.setStringAsync(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleClose = () => {
        setCopied(false);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <View style={styles.warningRow}>
                        <Ionicons name="warning" size={18} color="#F59E0B" />
                        <Text style={styles.warningText}>
                            Never share this {format === "mnemonic" ? "recovery phrase" : "private key"}.
                            Anyone with it can take your funds.
                        </Text>
                    </View>

                    <View style={styles.secretBox}>
                        <Text selectable style={styles.secretText}>{secret}</Text>
                    </View>

                    <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                        <Ionicons name={copied ? "checkmark" : "copy-outline"} size={16} color="#fff" />
                        <Text style={styles.copyText}>{copied ? "Copied" : "Copy to clipboard"}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
                        <Text style={styles.doneText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    card: {
        width: "100%",
        backgroundColor: "#2E2D2D",
        borderRadius: 16,
        padding: 20,
    },
    warningRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        marginBottom: 16,
    },
    warningText: { flex: 1, color: "#F59E0B", fontSize: 13, lineHeight: 18 },
    secretBox: {
        backgroundColor: "#3A3939",
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    secretText: { color: "#fff", fontSize: 15, lineHeight: 22 },
    copyBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#3A3939",
        borderRadius: 12,
        paddingVertical: 14,
        marginBottom: 10,
    },
    copyText: { color: "#fff", fontWeight: "600", fontSize: 14 },
    doneBtn: {
        backgroundColor: "#E8622A",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    doneText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
