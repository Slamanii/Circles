import { useState } from "react";
import {
    ActivityIndicator, Alert, ImageBackground, KeyboardAvoidingView, Platform,
    StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Login } from "../../services/login";
import { Colors } from "../../shared/theme";
import PasswordInput from "../../components/PasswordInput";

type Props = {
    onSuccess: (user: any, token: string) => void;
    onGoToCreate: () => void;
    onForgotPassword: () => void;
};

export default function SignInScreen({ onSuccess, onGoToCreate, onForgotPassword }: Props) {
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
        } catch (err) {
            Alert.alert("Sign in failed", err instanceof Error ? err.message : "Check your credentials and try again");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require("../../assets/images/img_6780.jpg")}
            style={styles.bg}
            resizeMode="cover"
        >
            <LinearGradient
                colors={["rgba(13,13,13,0.15)", "rgba(13,13,13,0.55)", "rgba(13,13,13,0.96)"]}
                locations={[0, 0.5, 0.85]}
                style={StyleSheet.absoluteFill}
            />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.inner}>
                    <BlurView intensity={40} tint="dark" style={styles.card}>
                        <View style={styles.cardInner}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Sign In</Text>
                                <Text style={styles.sub}>Welcome back</Text>
                            </View>

                            <View style={styles.fields}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor="#888"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    returnKeyType="next"
                                />
                                <PasswordInput
                                    placeholder="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    returnKeyType="done"
                                    onSubmitEditing={handleSignIn}
                                />
                            </View>

                            <TouchableOpacity style={styles.forgotRow} onPress={onForgotPassword} hitSlop={8}>
                                <Text style={styles.forgotText}>Forgot Password?</Text>
                            </TouchableOpacity>

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
                    </BlurView>
                </View>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: "center",
    },
    card: {
        borderRadius: 28,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.14)",
    },
    cardInner: {
        backgroundColor: "rgba(20,20,20,0.35)",
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 28,
    },
    header: {
        marginBottom: 28,
        gap: 6,
    },
    title: {
        color: "#fff",
        fontSize: 30,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    sub: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
    },
    fields: {
        gap: 12,
        marginBottom: 10,
    },
    input: {
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 15,
        color: "#fff",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.16)",
    },
    forgotRow: {
        alignSelf: "flex-end",
        marginBottom: 24,
    },
    forgotText: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 13,
        fontWeight: "500",
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
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
    },
    switchLink: {
        color: Colors.accentText,
        fontWeight: "600",
    },
});
