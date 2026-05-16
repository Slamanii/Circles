import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Props = {
    query: string;
    setQuery: (q: string) => void;
};

export default function CollectiblesHeader({ query, setQuery }: Props) {
    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
                <Text style={{ fontSize: 18, color: "white" }}>←</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Your Collectibles</Text>

            <TextInput
                placeholder="Search tickets"
                placeholderTextColor="#64748B"
                value={query}
                onChangeText={setQuery}
                style={styles.input}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 50,
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    back: {
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "white",
        marginBottom: 12,
    },
    input: {
        backgroundColor: "#1E293B",
        color: "white",
        padding: 12,
        borderRadius: 10,
    },
});
