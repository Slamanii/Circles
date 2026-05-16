import { StyleSheet, View } from "react-native";

export default function StoryHeader({ username }: { username: string }) {
    return (
        <View style={styles.container}>
            -
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