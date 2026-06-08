import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Login } from "../../services/login";
import { Colors } from "../../shared/theme";

type Props = {
    onSuccess: (user: any, token: string) => void;
    onGoToSignIn: () => void;
};

function SeedPhraseModal({
    mnemonic,
    onConfirm,
}: {
    mnemonic: string;
    onConfirm: () => void;
}) {
    const words = mnemonic.split(" ");

    return (
        <Modal visible animationType="slide" statusBarTranslucent>
            <View style={seed.container}>
                <ScrollView
                    contentContainerStyle={seed.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={seed.title}>Your Seed Phrase</Text>
                    <Text style={seed.warning}>
                        Write these 24 words down in order and store them somewhere safe.
                        Anyone with this phrase has full access to your wallet.
                        Fuego cannot recover it for you.
                    </Text>

                    <View style={seed.grid}>
                        {words.map((word, i) => (
                            <View key={i} style={seed.wordCell}>
                                <Text style={seed.wordIndex}>{i + 1}</Text>
                                <Text style={seed.wordText}>{word}</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity style={seed.btn} onPress={onConfirm} activeOpacity={0.85}>
                        <Text style={seed.btnText}>I've written it down  →</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </Modal>
    );
}

export default function CreateAccountScreen({ onSuccess, onGoToSignIn }: Props) {
    const [email,    setEmail]    = useState("");
    const [password, setPassword] = useState("");
    const [confirm,  setConfirm]  = useState("");
    const [loading,  setLoading]  = useState(false);

    const [pendingMnemonic, setPendingMnemonic] = useState<string | null>(null);
    const [pendingAuth,     setPendingAuth]     = useState<{ user: any; token: string } | null>(null);

    const handleCreate = async () => {
        if (!email.trim() || !password.trim() || !confirm.trim()) {
            Alert.alert("Please fill in all fields");
            return;
        }
        if (password !== confirm) {
            Alert.alert("Passwords don't match");
            return;
        }
        if (password.length < 8) {
            Alert.alert("Password must be at least 8 characters");
            return;
        }
        setLoading(true);
        try {
            const data = await Login(email.trim(), password);
            if (!data?.user || !data?.token) {
                Alert.alert("Sign up failed", "Something went wrong");
                return;
            }
            if (data.mnemonic) {
                // New account — hold credentials until user confirms seed phrase
                setPendingAuth({ user: data.user, token: data.token });
                setPendingMnemonic(data.mnemonic);
            } else {
                // No mnemonic means the email was already registered (e.g. network retry
                // succeeded server-side but the client retried). Prompt sign-in instead.
                Alert.alert(
                    "Account already exists",
                    "This email is already registered. Please sign in.",
                );
            }
        } catch (err: any) {
            Alert.alert("Sign up failed", err.message ?? "Please try again");
        } finally {
            setLoading(false);
        }
    };

    const handleSeedConfirmed = () => {
        if (pendingAuth) onSuccess(pendingAuth.user, pendingAuth.token);
    };

    return (
        <>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.inner}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.sub}>Join Fuego today</Text>
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
                            returnKeyType="next"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm password"
                            placeholderTextColor="#555"
                            value={confirm}
                            onChangeText={setConfirm}
                            secureTextEntry
                            returnKeyType="done"
                            onSubmitEditing={handleCreate}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.confirmBtn, (!email || !password || !confirm || loading) && styles.disabled]}
                        onPress={handleCreate}
                        disabled={!email || !password || !confirm || loading}
                        activeOpacity={0.85}
                    >
                        {loading
                            ? <ActivityIndicator color="#000" />
                            : <Text style={styles.confirmText}>Create Account  →</Text>
                        }
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.switchRow} onPress={onGoToSignIn}>
                        <Text style={styles.switchText}>
                            Already have an account?{"  "}
                            <Text style={styles.switchLink}>Sign In</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {pendingMnemonic && (
                <SeedPhraseModal
                    mnemonic={pendingMnemonic}
                    onConfirm={handleSeedConfirmed}
                />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0D0D0D" },
    inner: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 100,
        paddingBottom: 50,
        justifyContent: "center",
    },
    header:      { marginBottom: 36, gap: 6 },
    title:       { color: "#fff", fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
    sub:         { color: "#666", fontSize: 14 },
    fields:      { gap: 12, marginBottom: 24 },
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
    disabled:    { opacity: 0.4 },
    confirmText: { color: "#000", fontWeight: "700", fontSize: 15, letterSpacing: 0.2 },
    switchRow:   { alignItems: "center", marginTop: 4 },
    switchText:  { color: "#666", fontSize: 14 },
    switchLink:  { color: Colors.accent, fontWeight: "600" },
});

const seed = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0D0D0D" },
    scroll: {
        paddingHorizontal: 24,
        paddingTop: 72,
        paddingBottom: 48,
    },
    title: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "800",
        letterSpacing: -0.5,
        marginBottom: 16,
    },
    warning: {
        color: "#9CA3AF",
        fontSize: 14,
        lineHeight: 21,
        marginBottom: 32,
        backgroundColor: "#1A1A1A",
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 3,
        borderLeftColor: Colors.accent,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 40,
    },
    wordCell: {
        width: "30%",
        flexGrow: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1A1A1A",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 10,
        gap: 6,
        borderWidth: 1,
        borderColor: "#2A2A2A",
    },
    wordIndex: {
        color: Colors.accent,
        fontSize: 11,
        fontWeight: "700",
        width: 18,
    },
    wordText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "600",
        flex: 1,
    },
    btn: {
        backgroundColor: Colors.accent,
        borderRadius: 12,
        paddingVertical: 17,
        alignItems: "center",
    },
    btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
