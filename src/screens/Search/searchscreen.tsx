import { ActivityIndicator, FlatList, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import useSearchLogic from "./searchlogic";

export default function SearchScreen() {

    const { query, setQuery, results, loading, onUserPress } = useSearchLogic();

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <TextInput
                placeholder="Search users..."
                value={query}
                onChangeText={setQuery}
                style={{
                    backgroundColor: "#f2f2f2",
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 16,
                }}
            />

            {loading && <ActivityIndicator />}

            <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => onUserPress(item.id)}
                        style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
                    >
                        <Image
                            source={{ uri: item.avatar }}
                            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 2, borderColor: "orange" }}
                        />
                        <View>
                            <Text style={{ fontWeight: "bold" }}>{item.username}</Text>
                            <Text style={{ color: "gray" }}>{item.display_name}</Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}
