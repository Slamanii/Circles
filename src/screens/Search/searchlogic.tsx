import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { searchUsers } from "../../services/user";
import { fetchStories } from "../../services/story";

export default function useSearchLogic() {

    const navigation = useNavigation<any>();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [stories, setStories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStories().then(setStories).catch(console.error);
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        const timeout = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await searchUsers(query.trim());
                setResults(data);
            } catch (err) {
                console.error("Search error", err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [query]);

    const onUserPress = (userId: string) => {
        navigation.navigate("UserProfile", { followingId: userId });
    };

    const onStoryPress = (storyId: string) => {
        navigation.navigate("StoryDetail", { storyId, subId: undefined });
    };

    return {
        query,
        setQuery,
        results,
        stories,
        loading,
        onUserPress,
        onStoryPress,
    };
}
