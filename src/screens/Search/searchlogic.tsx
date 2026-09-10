import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { fetchStories, fetchStoriesPreview } from "../../services/story";
import { getMutedStoryUsers } from "../Stories/storieslogic";
import { searchUsers, UserSummary } from "../../services/user";
import { NormalizedStory } from "../../../shared/Types";

const RECENTS_KEY = "search_recents";
const MAX_RECENTS = 8;

export default function useSearchLogic() {
    const navigation = useNavigation<any>();

    const [query, setQueryRaw] = useState("");
    const [results, setResults] = useState<UserSummary[]>([]);
    const [stories, setStories] = useState<NormalizedStory[]>([]);
    const [previewStories, setPreviewStories] = useState<NormalizedStory[]>([]);
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    const loadStories = async () => {
        const [data, mutedIds] = await Promise.all([
            fetchStories().catch(() => []),
            getMutedStoryUsers(),
        ]);
        setStories((data ?? []).filter((s) => !mutedIds.includes(s.userId)));
    };

    useEffect(() => {
        loadStories().catch(console.error);
        fetchStoriesPreview().then((data) => setPreviewStories(data ?? [])).catch(console.error);
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
        const [d] = await Promise.all([
            fetchStoriesPreview().catch(() => []),
            loadStories(),
        ]);
        setPreviewStories(d ?? []);
    };

    return {
        query,
        setQuery,
        results,
        stories,
        previewStories,
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
