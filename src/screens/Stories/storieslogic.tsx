import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { viewStory } from "../../services/story";
import { NormalizedStory } from "../../../shared/Types";

const VIEWED_KEY = "@fuego/viewed_stories";
const MUTED_USERS_KEY = "@fuego/muted_story_users";

async function markStoryViewed(storyId: string) {
    try {
        const raw = await AsyncStorage.getItem(VIEWED_KEY);
        const ids: string[] = raw ? JSON.parse(raw) : [];
        if (!ids.includes(storyId)) {
            await AsyncStorage.setItem(VIEWED_KEY, JSON.stringify([...ids, storyId]));
        }
    } catch { /* non-critical */ }
}

async function getMutedStoryUsers(): Promise<string[]> {
    try {
        const raw = await AsyncStorage.getItem(MUTED_USERS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

async function muteStoryUser(userId: string) {
    try {
        const ids = await getMutedStoryUsers();
        if (!ids.includes(userId)) {
            await AsyncStorage.setItem(MUTED_USERS_KEY, JSON.stringify([...ids, userId]));
        }
    } catch { /* non-critical */ }
}

export default function useStoryLogic(story: NormalizedStory | null | undefined, subId?: string) {
    const navigation = useNavigation<any>();

    const initialIndex = useMemo(() => {
        if (!story || !subId) return 0;
        const idx = story.subStories.findIndex((s) => s.subId === subId);
        return idx >= 0 ? idx : 0;
    }, [story, subId]);

    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Story loads asynchronously after mount — seek to the deep-linked
    // sub-story once it arrives instead of staying stuck at index 0.
    useEffect(() => {
        if (!story) return;
        setCurrentIndex(initialIndex);
    }, [story?.storyId, initialIndex]);

    // Mark the initial sub-story as viewed when the story opens
    useEffect(() => {
        if (!story) return;
        const sub = story.subStories[initialIndex];
        if (sub?.subId) {
            viewStory({ storyItemId: sub.subId }).catch(console.error);
            markStoryViewed(story.storyId);
        }
    }, [story?.storyId]);

    if (!story) {
        return { currentSubStory: null, next: () => {}, prev: () => {}, currentIndex: 0, total: 0 };
    }

    const currentSubStory = story.subStories[currentIndex];

    const next = () => {
        if (currentIndex < story.subStories.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            const nextSub = story.subStories[nextIndex];
            if (nextSub?.subId) {
                viewStory({ storyItemId: nextSub.subId }).catch(console.error);
                markStoryViewed(story.storyId);
            }
        } else {
            navigation.goBack();
        }
    };

    const prev = () => {
        if (currentIndex > 0) {
            setCurrentIndex((i: number) => i - 1);
        } else {
            navigation.goBack();
        }
    };

    return {
        currentSubStory,
        next,
        prev,
        currentIndex,
        total: story.subStories.length,
    };
}

export { VIEWED_KEY, MUTED_USERS_KEY, getMutedStoryUsers, muteStoryUser };
