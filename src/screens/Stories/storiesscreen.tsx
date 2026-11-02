import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteStory, deleteSubStory, fetchComments, fetchStoryById, fetchStoryLikes, fetchStoryViews, likeStory, unlikeStory } from "../../services/story";
import StoryCommentsModal from "./StoryCommentsModal";
import { unfollowUser } from "../../services/user";
import { AppNotification } from "../../services/notifications";
import { getSocket } from "../../services/socket";
import useStoryLogic, { muteStoryUser } from "./storieslogic";
import { useNavigation } from "@react-navigation/native";
import { NormalizedStory, RawStoryLike, RawStoryView } from "../../../shared/Types";

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
    const [story, setStory] = useState<NormalizedStory | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [viewers, setViewers] = useState<RawStoryView[]>([]);
    const [likers, setLikers] = useState<RawStoryLike[]>([]);
    const [commentCount, setCommentCount] = useState(0);
    const [commentsVisible, setCommentsVisible] = useState(false);

    const progress = useRef(new Animated.Value(0)).current;
    const animRef  = useRef<Animated.CompositeAnimation | null>(null);
    const pausedAt = useRef(0);

    useEffect(() => {
        fetchStoryById(storyId)
            .then((s) => setStory(s ?? null))
            .catch(console.error)
            .finally(() => setLoading(false));
        AsyncStorage.getItem("user")
            .then((s) => setCurrentUserId(s ? JSON.parse(s).id : null))
            .catch(() => {});
    }, [storyId]);

    const { currentSubStory, next, prev, currentIndex, total } = useStoryLogic(story, subId);
    const isOwner = !!story && !!currentUserId && story.userId === currentUserId;

    // Likes and comments are scoped to the whole story, not any one segment —
    // fetched once per story rather than re-fetched on every sub-story change.
    useEffect(() => {
        if (!story) return;
        fetchStoryLikes(story.storyId)
            .then((data) => {
                setLikers(data ?? []);
                setLiked((data ?? []).some((l) => l.user_id === currentUserId));
            })
            .catch(console.error);
        fetchComments(story.storyId)
            .then((data) => setCommentCount((data ?? []).length))
            .catch(() => setCommentCount(0));
    }, [story?.storyId, currentUserId]);

    // Views stay per sub-story segment — each segment is legitimately watched separately.
    useEffect(() => {
        if (!currentSubStory) return;
        if (isOwner) {
            fetchStoryViews(currentSubStory.subId)
                .then((data) => setViewers(data ?? []))
                .catch(console.error);
        } else {
            setViewers([]);
        }
    }, [currentSubStory?.subId, isOwner]);

    // Live-update the like count while the owner is watching their own story,
    // instead of only reflecting likes gathered at the initial fetch above.
    useEffect(() => {
        if (!isOwner || !story) return;
        const storyId = story.storyId;
        const s = getSocket();
        const handler = (n: AppNotification) => {
            if (n.type === "story_liked" && (n.reference_id === storyId || n.metadata?.storyId === storyId)) {
                fetchStoryLikes(storyId).then((data) => setLikers(data ?? [])).catch(console.error);
            }
        };
        s?.on("notification", handler);
        return () => { s?.off("notification", handler); };
    }, [isOwner, story?.storyId]);

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
        if (!story) return;
        const nextLiked = !liked;
        setLiked(nextLiked);
        setLikers((prev) =>
            nextLiked
                ? [...prev, { user_id: currentUserId ?? "", users: null }]
                : prev.filter((l) => l.user_id !== currentUserId)
        );
        try {
            if (nextLiked) {
                await likeStory({ storyId: story.storyId });
            } else {
                await unlikeStory({ storyId: story.storyId });
            }
        } catch { /* optimistic update already applied */ }
    };

    const openComments = () => {
        pauseProgress();
        setCommentsVisible(true);
    };

    const closeComments = () => {
        setCommentsVisible(false);
        resumeProgress();
        if (story) {
            fetchComments(story.storyId)
                .then((data) => setCommentCount((data ?? []).length))
                .catch(() => {});
        }
    };

    const handleShare = async () => {
        if (!story) return;
        try {
            await Share.share({ message: `Check out ${story.userName}'s story on Fuego` });
        } catch (err) {
            console.error("Share failed", err);
        }
    };

    const handleOpenMenu = () => {
        if (!currentSubStory) return;
        Alert.alert("Story Options", "Choose an option", [
            {
                text: "Delete This Photo/Video",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteSubStory(currentSubStory.subId);
                        if (total <= 1) {
                            navigation.goBack();
                        } else {
                            fetchStoryById(storyId).then((s) => setStory(s ?? null)).catch(console.error);
                        }
                    } catch (err) {
                        console.error("deleteSubStory failed", err);
                        Alert.alert("Failed to delete");
                    }
                },
            },
            {
                text: "Delete Entire Story",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteStory(storyId);
                        navigation.goBack();
                    } catch (err) {
                        console.error("deleteStory failed", err);
                        Alert.alert("Failed to delete story");
                    }
                },
            },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    const handleOpenOtherMenu = () => {
        if (!story) return;
        Alert.alert("Story Options", "Choose an option", [
            {
                text: "Share",
                onPress: async () => {
                    try {
                        await Share.share({ message: `Check out ${story.userName}'s story on Fuego` });
                    } catch (err) {
                        console.error("Share failed", err);
                    }
                },
            },
            {
                text: "Unfollow",
                style: "destructive",
                onPress: async () => {
                    try {
                        await unfollowUser(story.userId);
                    } catch (err) {
                        console.error("unfollowUser failed", err);
                    }
                },
            },
            {
                text: "Mute",
                onPress: async () => {
                    await muteStoryUser(story.userId);
                    navigation.goBack();
                },
            },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    if (loading || !story || !currentSubStory) return null;

    return (
        <View style={styles.container}>
            <Image
                source={{ uri: currentSubStory.mediaUrl }}
                style={styles.media}
                contentFit="cover"
            />

            {/* Gradient overlay top */}
            <View style={styles.topOverlay}>
                <ProgressBars total={total} current={currentIndex} progress={progress} />
                <View style={styles.header}>
                    <Text style={styles.username}>{story.userName}</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            onPress={isOwner ? handleOpenMenu : handleOpenOtherMenu}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Caption */}
            {currentSubStory.caption ? (
                <View style={styles.captionWrap}>
                    <Text style={styles.caption}>{currentSubStory.caption}</Text>
                </View>
            ) : null}

            {/* Like / comment / share rail */}
            <View style={styles.actionRail}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
                    <Ionicons
                        name={liked ? "heart" : "heart-outline"}
                        size={28}
                        color={liked ? "#EF4444" : "#fff"}
                    />
                    {likers.length > 0 && <Text style={styles.actionCount}>{likers.length}</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={openComments}>
                    <Ionicons name="chatbubble-outline" size={25} color="#fff" />
                    {commentCount > 0 && <Text style={styles.actionCount}>{commentCount}</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                    <Ionicons name="paper-plane-outline" size={25} color="#fff" />
                </TouchableOpacity>
            </View>

            <StoryCommentsModal
                visible={commentsVisible}
                onClose={closeComments}
                storyId={story.storyId}
                currentUserId={currentUserId}
            />

            {/* Views/likes stats — owner only */}
            {isOwner && (
                <TouchableOpacity
                    style={styles.statsRow}
                    onPress={() =>
                        Alert.alert(
                            "Story Stats",
                            `${viewers.length} view${viewers.length === 1 ? "" : "s"} · ${likers.length} like${likers.length === 1 ? "" : "s"}\n\n` +
                                (viewers.length
                                    ? `Viewed by: ${viewers.map((v) => v.users?.username).filter(Boolean).join(", ")}`
                                    : "No views yet")
                        )
                    }
                >
                    <View style={styles.statItem}>
                        <Ionicons name="eye-outline" size={18} color="#fff" />
                        <Text style={styles.statText}>{viewers.length}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="heart-outline" size={18} color="#fff" />
                        <Text style={styles.statText}>{likers.length}</Text>
                    </View>
                </TouchableOpacity>
            )}

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
    headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
    captionWrap: {
        position: "absolute",
        bottom: 80,
        left: 16,
        right: 72,
    },
    caption: { color: "#fff", fontSize: 15, fontWeight: "500", textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
    actionRail: { position: "absolute", bottom: 72, right: 20, alignItems: "center", gap: 18 },
    actionBtn: { alignItems: "center", gap: 2 },
    actionCount: { color: "#fff", fontSize: 11, fontWeight: "600" },
    statsRow: { position: "absolute", bottom: 76, left: 20, flexDirection: "row", gap: 14 },
    statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    statText: { color: "#fff", fontSize: 13, fontWeight: "600" },
    tapRow:  { ...StyleSheet.absoluteFillObject, flexDirection: "row", top: 100 },
    tapZone: { flex: 1, height: "100%" },
    tapZoneCenter: { flex: 2, height: "100%" },
});
