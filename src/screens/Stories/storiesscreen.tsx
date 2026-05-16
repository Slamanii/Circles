import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";
import { fetchStories } from "../../services/story";
import useStoryLogic from "./storieslogic";

export default function StoryScreen({ route }: any) {

    const { storyId, subId } = route.params;
    const navigation = useNavigation<any>();
    const [stories, setStories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStories()
            .then(setStories)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const { story, currentSubStory, next, prev } = useStoryLogic(storyId, subId, stories);

    if (loading) return <View><ActivityIndicator /></View>;
    if (!story || !currentSubStory) return <View><Text>Story not found</Text></View>;

    return (
        <View style={{ flex: 1, backgroundColor: "black" }}>

            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={{ fontSize: 18, color: "white", padding: 16 }}>←</Text>
            </TouchableOpacity>

            <Image
                source={{ uri: currentSubStory.mediaUrl }}
                style={{ flex: 1 }}
                resizeMode="cover"
            />

            {/* Tap regions */}
            <View style={{ position: "absolute", width: "100%", height: "100%", flexDirection: "row" }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={prev} />
                <TouchableOpacity style={{ flex: 1 }} onPress={next} />
            </View>

            {/* Footer */}
            <View style={{ position: "absolute", bottom: 40, left: 20 }}>
                <Text style={{ color: "white", fontSize: 18 }}>{story.userName}</Text>
                <Text style={{ color: "white" }}>{currentSubStory.caption}</Text>
            </View>
        </View>
    );
}
