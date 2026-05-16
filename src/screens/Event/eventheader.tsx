import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
    showBack?: boolean;
    onCreateEvent?: () => void;
};

export default function EventHeader({ showBack = false, onCreateEvent }: Props) {
    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            {showBack ? (
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.back}>←</Text>
                </TouchableOpacity>
            ) : (
                <Text style={styles.title}>Events</Text>
            )}

            {onCreateEvent && (
                <TouchableOpacity onPress={onCreateEvent} style={styles.createBtn}>
                    <Text style={styles.createText}>+ Create</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 50,
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "white",
    },
    back: {
        fontSize: 22,
        color: "white",
    },
    createBtn: {
        backgroundColor: "#3B82F6",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    createText: {
        color: "white",
        fontWeight: "600",
        fontSize: 13,
    },
});
