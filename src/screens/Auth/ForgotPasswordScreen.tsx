import { useState } from "react";
import {
    ActivityIndicator, Alert, ImageBackground, KeyboardAvoidingView, Platform,
    StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { requestPasswordReset, resetPassword } from "../../services/login";
import { Colors } from "../../shared/theme";
import PasswordInput from "../../components/PasswordInput";

type Props = {
    onBackToSignIn: () => void;
};

type Step = "email" | "reset";

export default function ForgotPasswordScreen({ onBackToSignIn }: Props) {
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSendCode = async () => {
        if (!email.trim()) {
            Alert.alert("Enter your email");
            return;
        }
        setLoading(true);
        try {
            await requestPasswordReset(email.trim());
            setStep("reset");
        } catch (err) {
            Alert.alert("Something went wrong", err instanceof Error ? err.message : "Try again");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!code.trim() || !newPassword.trim()) {
            Alert.alert("Please fill in all fields");
            return;
        }
        setLoading(true);
        try {
            await resetPassword(email.trim(), newPassword, code.trim());
            Alert.alert("Password updated", "You can now sign in with your new password.", [
                { text: "OK", onPress: onBackToSignIn },
            ]);
        } catch (err) {
            Alert.alert("Reset failed", err instanceof Error ? err.message : "Invalid or expired code");
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
                <TouchableOpacity style={styles.backBtn} onPress={onBackToSignIn} hitSlop={12}>
                    <Ionicons name="chevron-back" size={22} color="#fff" />
                </TouchableOpacity>

                <View style={styles.inner}>
                    <BlurView intensity={40} tint="dark" style={styles.card}>
                        <View style={styles.cardInner}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Reset Password</Text>
                                <Text style={styles.sub}>
                                    {step === "email"
                                        ? "Enter your email and we'll send you a reset code"
                                        : `Enter the code sent to ${email.trim()}`}
                                </Text>
                            </View>

                            {step === "email" ? (
                                <>
                                    <View style={styles.fields}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Email"
                                            placeholderTextColor="#888"
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                            returnKeyType="done"
                                            onSubmitEditing={handleSendCode}
                                        />
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.confirmBtn, (!email || loading) && styles.disabled]}
                                        onPress={handleSendCode}
                                        disabled={!email || loading}
                                        activeOpacity={0.85}
                                    >
                                        {loading
                                            ? <ActivityIndicator color="#000" />
                                            : <Text style={styles.confirmText}>Send Code  →</Text>
                                        }
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <View style={styles.fields}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="6-digit code"
                                            placeholderTextColor="#888"
                                            value={code}
                                            onChangeText={setCode}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            returnKeyType="next"
                                        />
                                        <PasswordInput
                                            placeholder="New password"
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            returnKeyType="done"
                                            onSubmitEditing={handleResetPassword}
                                        />
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.confirmBtn, (!code || !newPassword || loading) && styles.disabled]}
                                        onPress={handleResetPassword}
                                        disabled={!code || !newPassword || loading}
                                        activeOpacity={0.85}
                                    >
                                        {loading
                                            ? <ActivityIndicator color="#000" />
                                            : <Text style={styles.confirmText}>Reset Password  →</Text>
                                        }
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.resendRow} onPress={handleSendCode} disabled={loading}>
                                        <Text style={styles.resendText}>Didn't get a code? <Text style={styles.resendLink}>Resend</Text></Text>
                                    </TouchableOpacity>
                                </>
                            )}
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
    backBtn: {
        marginTop: 54,
        marginLeft: 20,
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "rgba(0,0,0,0.35)",
        alignItems: "center",
        justifyContent: "center",
    },
    inner: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 50,
        justifyContent: "flex-end",
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
        fontSize: 28,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    sub: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
    },
    fields: {
        gap: 12,
        marginBottom: 24,
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
    confirmBtn: {
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 17,
        alignItems: "center",
        marginBottom: 8,
    },
    disabled: { opacity: 0.4 },
    confirmText: {
        color: "#000",
        fontWeight: "700",
        fontSize: 15,
        letterSpacing: 0.2,
    },
    resendRow: {
        alignItems: "center",
        marginTop: 8,
    },
    resendText: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
    },
    resendLink: {
        color: Colors.accentText,
        fontWeight: "600",
    },
});
