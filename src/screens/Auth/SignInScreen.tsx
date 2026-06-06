import { useState } from "react";
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
    StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { Login } from "../../services/login";
import { Colors } from "../../shared/theme";

type Props = {
    onSuccess: (user: any, token: string) => void;
    onGoToCreate: () => void;
};

export default function SignInScreen({ onSuccess, onGoToCreate }: Props) {
    const [email,    setEmail]    = useState("");
    const [password, setPassword] = useState("");
    const [loading,  setLoading]  = useState(false);

    const handleSignIn = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Please fill in all fields");
            return;
        }
        setLoading(true);
        try {
            const data = await Login(email.trim(), password);
            if (data?.user && data?.token) onSuccess(data.user, data.token);
            else Alert.alert("Sign in failed", "Invalid credentials");
        } catch (err: any) {
            Alert.alert("Sign in failed", err.message ?? "Check your credentials and try again");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.inner}>
                <View style={styles.header}>
                    <Text style={styles.title}>Sign In</Text>
                    <Text style={styles.sub}>Welcome back</Text>
                </View>

                <View style={styles.fields}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#555"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        returnKeyType="next"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#555"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        returnKeyType="done"
                        onSubmitEditing={handleSignIn}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.confirmBtn, (!email || !password || loading) && styles.disabled]}
                    onPress={handleSignIn}
                    disabled={!email || !password || loading}
                    activeOpacity={0.85}
                >
                    {loading
                        ? <ActivityIndicator color="#000" />
                        : <Text style={styles.confirmText}>Sign In  →</Text>
                    }
                </TouchableOpacity>

                <TouchableOpacity style={styles.switchRow} onPress={onGoToCreate}>
                    <Text style={styles.switchText}>
                        Don't have an account?{"  "}
                        <Text style={styles.switchLink}>Create one</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0D0D0D",
    },
    inner: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 100,
        paddingBottom: 50,
        justifyContent: "center",
    },
    header: {
        marginBottom: 36,
        gap: 6,
    },
    title: {
        color: "#fff",
        fontSize: 32,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    sub: {
        color: "#666",
        fontSize: 14,
    },
    fields: {
        gap: 12,
        marginBottom: 24,
    },
    input: {
        backgroundColor: "#1A1A1A",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 15,
        color: "#fff",
        borderWidth: 1,
        borderColor: "#2A2A2A",
    },
    confirmBtn: {
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 17,
        alignItems: "center",
        marginBottom: 20,
    },
    disabled: { opacity: 0.4 },
    confirmText: {
        color: "#000",
        fontWeight: "700",
        fontSize: 15,
        letterSpacing: 0.2,
    },
    switchRow: {
        alignItems: "center",
        marginTop: 4,
    },
    switchText: {
        color: "#666",
        fontSize: 14,
    },
    switchLink: {
        color: Colors.accent,
        fontWeight: "600",
    },
});
