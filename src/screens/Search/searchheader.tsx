import { StyleSheet, View } from "react-native";

export default function SearchHeader() {
    return (
        <View style={styles.container}>
            <input type="text" style={ styles.subtitle} placeholder="search"/>
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
        fontSize: 9,
        color: "#CBD5F5",
        marginTop: 8,
        borderRadius: 30,
    }
});