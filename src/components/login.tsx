import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { Login } from "../services/login";

export default function LoginScreen({ onLogin }: any) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Email and password are required");
            return;
        }
        setLoading(true);
        try {
            const data = await Login(email.trim(), password);
            if (data?.user && data?.token) {
                onLogin(data.user, data.token);
            }
        } catch (err: any) {
            Alert.alert("Login failed", err.message ?? "Check your credentials and try again");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Fuego</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#64748B"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity
                style={[styles.btn, (loading || !email || !password) && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={loading || !email || !password}
            >
                {loading
                    ? <ActivityIndicator color="white" />
                    : <Text style={styles.btnText}>Login / Sign up</Text>
                }
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0F172A",
        justifyContent: "center",
        padding: 28,
    },
    heading: {
        color: "white",
        fontSize: 36,
        fontWeight: "bold",
        marginBottom: 40,
        textAlign: "center",
    },
    input: {
        backgroundColor: "#1E293B",
        color: "white",
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        marginBottom: 14,
    },
    btn: {
        backgroundColor: "#3B82F6",
        padding: 15,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 6,
    },
    btnDisabled: {
        backgroundColor: "#334155",
    },
    btnText: {
        color: "white",
        fontWeight: "700",
        fontSize: 15,
    },
});
