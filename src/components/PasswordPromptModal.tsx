import { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function PasswordPromptModal({
    visible,
    loading,
    error,
    onSubmit,
    onCancel,
}: {
    visible: boolean;
    loading: boolean;
    error: string | null;
    onSubmit: (password: string) => void;
    onCancel: () => void;
}) {
    const [password, setPassword] = useState("");

    const handleSubmit = () => {
        if (!password) return;
        onSubmit(password);
    };

    const handleCancel = () => {
        setPassword("");
        onCancel();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <Text style={styles.title}>Confirm your password</Text>
                    <Text style={styles.subtitle}>Re-enter your password to authorize this action.</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#6B7280"
                        secureTextEntry
                        autoFocus
                        value={password}
                        onChangeText={setPassword}
                        editable={!loading}
                        onSubmitEditing={handleSubmit}
                    />

                    {error && <Text style={styles.error}>{error}</Text>}

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={loading}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.confirmBtn, (loading || !password) && styles.disabled]}
                            onPress={handleSubmit}
                            disabled={loading || !password}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.confirmText}>Confirm</Text>
                            }
                        </TouchableOpacity>
                    </View>
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
    title:    { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 6 },
    subtitle: { color: "#9CA3AF", fontSize: 13, marginBottom: 16 },
    input: {
        backgroundColor: "#3A3939",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: "#fff",
        fontSize: 15,
        marginBottom: 8,
    },
    error:   { color: "#F87171", fontSize: 13, marginBottom: 8 },
    actions: { flexDirection: "row", gap: 12, marginTop: 8 },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: "#3A3939",
    },
    cancelText: { color: "#fff", fontWeight: "600", fontSize: 15 },
    confirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: "#E8622A",
    },
    disabled:    { opacity: 0.4 },
    confirmText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
