import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { fetchStories, likeStory } from "../../services/story";
import useStoryLogic from "./storieslogic";
import { useNavigation } from "@react-navigation/native";

const STORY_DURATION = 5000;

function ProgressBars({ total, current, progress }: { total: number; current: number; progress: Animated.Value }) {
    return (
        <View style={styles.progressRow}>
            {Array.from({ length: total }).map((_, i) => (
                <View key={i} style={styles.progressTrack}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            {
                                width: i < current
                                    ? "100%"
                                    : i === current
                                    ? progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] })
                                    : "0%",
                            },
                        ]}
                    />
                </View>
            ))}
        </View>
    );
}

export default function StoryScreen({ route }: any) {
    const { storyId, subId } = route.params;
    const navigation = useNavigation<any>();
    const [stories, setStories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);

    const progress = useRef(new Animated.Value(0)).current;
    const animRef  = useRef<Animated.CompositeAnimation | null>(null);
    const pausedAt = useRef(0);

    useEffect(() => {
        fetchStories()
            .then(setStories)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const { story, currentSubStory, next, prev, currentIndex, total } = useStoryLogic(storyId, subId, stories);

    // Restart progress bar whenever sub-story changes
    useEffect(() => {
        if (!currentSubStory) return;
        progress.setValue(0);
        pausedAt.current = 0;
        startProgress();
        return () => animRef.current?.stop();
    }, [currentIndex, currentSubStory?.subId]);

    const startProgress = () => {
        animRef.current?.stop();
        const remaining = (1 - pausedAt.current) * STORY_DURATION;
        const anim = Animated.timing(progress, {
            toValue: 1,
            duration: remaining,
            useNativeDriver: false,
        });
        animRef.current = anim;
        anim.start(({ finished }) => {
            if (finished) {
                pausedAt.current = 0;
                next();
            }
        });
    };

    const pauseProgress = () => {
        animRef.current?.stop();
        (progress as any)._value !== undefined && (pausedAt.current = (progress as any)._value);
    };

    const resumeProgress = () => {
        startProgress();
    };

    const handleLike = async () => {
        if (!currentSubStory) return;
        setLiked(prev => !prev);
        try {
            await likeStory({ storyItemId: currentSubStory.subId });
        } catch { /* optimistic update already applied */ }
    };

    if (loading || !story || !currentSubStory) return null;

    return (
        <View style={styles.container}>
            <Image
                source={{ uri: currentSubStory.mediaUrl }}
                style={styles.media}
                resizeMode="cover"
            />

            {/* Gradient overlay top */}
            <View style={styles.topOverlay}>
                <ProgressBars total={total} current={currentIndex} progress={progress} />
                <View style={styles.header}>
                    <Text style={styles.username}>{story.userName}</Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Caption */}
            {currentSubStory.caption ? (
                <View style={styles.captionWrap}>
                    <Text style={styles.caption}>{currentSubStory.caption}</Text>
                </View>
            ) : null}

            {/* Like button */}
            <TouchableOpacity style={styles.likeBtn} onPress={handleLike}>
                <Ionicons
                    name={liked ? "heart" : "heart-outline"}
                    size={28}
                    color={liked ? "#EF4444" : "#fff"}
                />
            </TouchableOpacity>

            {/* Tap regions — prev / pause-hold / next */}
            <View style={styles.tapRow}>
                <TouchableOpacity style={styles.tapZone} onPress={prev} />
                <TouchableWithoutFeedback
                    onPressIn={pauseProgress}
                    onPressOut={resumeProgress}
                >
                    <View style={styles.tapZoneCenter} />
                </TouchableWithoutFeedback>
                <TouchableOpacity style={styles.tapZone} onPress={() => { pausedAt.current = 0; next(); }} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    media:     { ...StyleSheet.absoluteFillObject },
    topOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 50,
        paddingHorizontal: 10,
        paddingBottom: 8,
        backgroundColor: "rgba(0,0,0,0.25)",
    },
    progressRow:  { flexDirection: "row", gap: 4, marginBottom: 10 },
    progressTrack: { flex: 1, height: 2, backgroundColor: "rgba(255,255,255,0.35)", borderRadius: 1, overflow: "hidden" },
    progressFill:  { height: "100%", backgroundColor: "#fff", borderRadius: 1 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    username:  { color: "#fff", fontWeight: "700", fontSize: 15 },
    captionWrap: {
        position: "absolute",
        bottom: 80,
        left: 16,
        right: 72,
    },
    caption: { color: "#fff", fontSize: 15, fontWeight: "500", textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
    likeBtn: { position: "absolute", bottom: 72, right: 20 },
    tapRow:  { ...StyleSheet.absoluteFillObject, flexDirection: "row", top: 100 },
    tapZone: { flex: 1, height: "100%" },
    tapZoneCenter: { flex: 2, height: "100%" },
});
