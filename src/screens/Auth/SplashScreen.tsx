import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Colors } from "../../shared/theme";

export default function SplashScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.logo}>fuego</Text>
            <ActivityIndicator color={Colors.accent} size="small" style={styles.spinner} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1A1A1A",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
    },
    logo: {
        fontSize: 48,
        fontWeight: "900",
        color: Colors.accent,
        letterSpacing: -1,
    },
    spinner: {
        position: "absolute",
        bottom: 80,
    },
});
