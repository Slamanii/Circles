import { useNavigation } from "@react-navigation/native";
import { useMemo, useState } from "react";
import { viewStory } from "../../services/story";

export default function useStoryLogic(storyId: string, subId?: string, stories: any[] = []) {

    const navigation = useNavigation<any>();

    const story = useMemo(
        () => stories.find((s) => s.storyId === storyId),
        [storyId, stories]
    );

    const initialIndex = useMemo(() => {
        if (!story || !subId) return 0;
        const idx = story.subStories.findIndex((s: any) => s.subId === subId);
        return idx >= 0 ? idx : 0;
    }, [story, subId]);

    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    if (!story) {
        return { story: null, currentSubStory: null, next: () => {}, prev: () => {} };
    }

    const currentSubStory = story.subStories[currentIndex];

    const next = () => {
        if (currentIndex < story.subStories.length - 1) {
            setCurrentIndex((i: number) => i + 1);
            viewStory({ subStoryId: story.subStories[currentIndex + 1]?.subId });
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
