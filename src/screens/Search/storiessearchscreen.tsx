import { FlatList, Image, TextInput, TouchableOpacity, View } from "react-native";
import useSearchLogic from "./searchlogic";

export default function StoriesSearchScreen() {

    const { query, setQuery, stories, onStoryPress } = useSearchLogic();

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <TextInput
                placeholder="Search stories..."
                value={query}
                onChangeText={setQuery}
                style={{
                    backgroundColor: "#f2f2f2",
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 16,
                }}
            />
            <FlatList
                data={stories}
                numColumns={3}
                key="grid"
                keyExtractor={(item) => item.storyId}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={{ flex: 1, alignItems: "center", marginBottom: 16 }}
                        onPress={() => onStoryPress(item.storyId)}
                    >
                        <Image
                            source={{ uri: item.subStories[0]?.mediaUrl }}
                            style={{ width: 80, height: 80, borderRadius: 40 }}
                        />
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}
