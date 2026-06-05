import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { fetchDiscoverStories, fetchStories } from "../../services/story";
import { searchUsers } from "../../services/user";

const RECENTS_KEY = "search_recents";
const MAX_RECENTS = 8;

export default function useSearchLogic() {
    const navigation = useNavigation<any>();

    const [query, setQueryRaw] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [stories, setStories] = useState<any[]>([]);
    const [discoverStories, setDiscoverStories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        fetchStories().then((data) => setStories(data ?? [])).catch(console.error);
        fetchDiscoverStories().then((data) => setDiscoverStories(data ?? [])).catch(console.error);
        AsyncStorage.getItem(RECENTS_KEY)
            .then((raw) => setRecentSearches(raw ? JSON.parse(raw) : []))
            .catch(console.error);
    }, []);

    // Debounced user search
    useEffect(() => {
        if (!query.trim()) { setResults([]); return; }
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

    const saveRecent = async (term: string) => {
        const next = [term, ...recentSearches.filter((r) => r !== term)].slice(0, MAX_RECENTS);
        setRecentSearches(next);
        await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    };

    const setQuery = (val: string) => setQueryRaw(val);

    const onUserPress = (userId: string) => {
        if (query.trim()) saveRecent(query.trim());
        navigation.navigate("UserProfile", { followingId: userId });
    };

    const onStoryPress = (storyId: string) => {
        navigation.navigate("StoryDetail", { storyId, subId: undefined });
    };

    const onUploadPress = () => navigation.navigate("StoryUpload");

    const onRecentPress = (term: string) => setQueryRaw(term);

    const onRemoveRecent = async (term: string) => {
        const next = recentSearches.filter((r) => r !== term);
        setRecentSearches(next);
        await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    };

    const reload = async () => {
        const [s, d] = await Promise.all([
            fetchStories().catch(() => []),
            fetchDiscoverStories().catch(() => []),
        ]);
        setStories(s ?? []);
        setDiscoverStories(d ?? []);
    };

    return {
        query,
        setQuery,
        results,
        stories,
        discoverStories,
        loading,
        recentSearches,
        onUserPress,
        onStoryPress,
        onUploadPress,
        onRecentPress,
        onRemoveRecent,
        reload,
    };
}
