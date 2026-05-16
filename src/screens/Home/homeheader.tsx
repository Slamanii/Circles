import { StyleSheet, Text, View } from "react-native";

export default function HomeHeader({ username }: { username: string }) {
    return (
        <View style={styles.container}>
            <Text style={styles.subtitle}>
                Welcome back, {username}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 50,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "white",
    },
    subtitle: {
        fontSize: 16,
        color: "#CBD5F5",
        marginTop: 5,
    }
});