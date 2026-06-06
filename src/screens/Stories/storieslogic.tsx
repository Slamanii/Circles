import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { viewStory } from "../../services/story";

const VIEWED_KEY = "@fuego/viewed_stories";

async function markStoryViewed(storyId: string) {
    try {
        const raw = await AsyncStorage.getItem(VIEWED_KEY);
        const ids: string[] = raw ? JSON.parse(raw) : [];
        if (!ids.includes(storyId)) {
            await AsyncStorage.setItem(VIEWED_KEY, JSON.stringify([...ids, storyId]));
        }
    } catch { /* non-critical */ }
}

export default function useStoryLogic(storyId: string, subId?: string, stories: any[] = []) {
    const navigation = useNavigation<any>();

    const story = useMemo(
        () => stories.find((s) => s.storyId === storyId),
        [storyId, stories],
    );

    const initialIndex = useMemo(() => {
        if (!story || !subId) return 0;
        const idx = story.subStories.findIndex((s: any) => s.subId === subId);
        return idx >= 0 ? idx : 0;
    }, [story, subId]);

    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Mark the initial sub-story as viewed when the story opens
    useEffect(() => {
        if (!story) return;
        const sub = story.subStories[initialIndex];
        if (sub?.subId) {
            viewStory({ storyItemId: sub.subId });
            markStoryViewed(story.storyId);
        }
    }, [story?.storyId]);

    if (!story) {
        return { story: null, currentSubStory: null, next: () => {}, prev: () => {}, currentIndex: 0, total: 0 };
    }

    const currentSubStory = story.subStories[currentIndex];

    const next = () => {
        if (currentIndex < story.subStories.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            const nextSub = story.subStories[nextIndex];
            if (nextSub?.subId) {
                viewStory({ storyItemId: nextSub.subId });
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
        story,
        currentSubStory,
        next,
        prev,
        currentIndex,
        total: story.subStories.length,
    };
}

export { VIEWED_KEY };
