import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../shared/theme";

type Props = {
    onCreateAccount: () => void;
    onSignIn: () => void;
};

function ProgressDots({ count = 3, active = 0 }) {
    return (
        <View style={dots.row}>
            {Array.from({ length: count }).map((_, i) => (
                <View
                    key={i}
                    style={[dots.segment, { backgroundColor: i === active ? "#fff" : "rgba(255,255,255,0.25)" }]}
                />
            ))}
        </View>
    );
}

const dots = StyleSheet.create({
    row:     { flexDirection: "row", gap: 6, marginBottom: 28 },
    segment: { flex: 1, height: 3, borderRadius: 2 },
});

export default function WelcomeScreen({ onCreateAccount, onSignIn }: Props) {
    return (
        <View style={styles.container}>

            {/* Top copy */}
            <View style={styles.top}>
                <Text style={styles.welcome}>Welcome to Fuego</Text>
                <Text style={styles.headline}>Your next{"\n"}unforgettable{"\n"}night starts here</Text>
            </View>

            {/* Card placeholder — swap in your assets here */}
            <View style={styles.cardPlaceholder}>
                <ProgressDots count={3} active={0} />
                {/* TODO: add card / graphic assets */}
            </View>

            {/* Buttons */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.primaryBtn} onPress={onCreateAccount} activeOpacity={0.85}>
                    <Text style={styles.primaryText}>Create Account  →</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryBtn} onPress={onSignIn} activeOpacity={0.85}>
                    <Text style={styles.secondaryText}>Sign In  →</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0D0D0D",
        paddingHorizontal: 24,
        paddingTop: 70,
        paddingBottom: 50,
        justifyContent: "space-between",
    },
    top: {
        gap: 10,
    },
    welcome: {
        color: "#888",
        fontSize: 13,
        fontWeight: "500",
        letterSpacing: 0.3,
    },
    headline: {
        color: "#fff",
        fontSize: 36,
        fontWeight: "800",
        lineHeight: 42,
        letterSpacing: -0.5,
    },
    cardPlaceholder: {
        flex: 1,
        marginVertical: 32,
        justifyContent: "flex-end",
    },
    actions: {
        gap: 12,
    },
    primaryBtn: {
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 17,
        alignItems: "center",
    },
    primaryText: {
        color: "#000",
        fontWeight: "700",
        fontSize: 15,
        letterSpacing: 0.2,
    },
    secondaryBtn: {
        backgroundColor: "#1A1A1A",
        borderRadius: 12,
        paddingVertical: 17,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#2E2E2E",
    },
    secondaryText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 15,
        letterSpacing: 0.2,
    },
});
