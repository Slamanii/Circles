import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { Share } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import {
    fetchHostedEvents,
    fetchLikedEvents,
    followUser,
    getUserProfile,
} from "../../services/user";
import { fetchStoryByUser } from "../../services/story";

const PAGE_SIZE = 5;

export function useUserLogic(followingId?: string) {
    const navigation = useNavigation<any>();

    const [refreshing, setRefreshing] = useState(false);
    const [followed, setFollowed] = useState(false);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [avatar, setAvatar] = useState<string | null>(null);
    const [bio, setBio] = useState<string | null>(null);
    const [link1, setLink1] = useState<string | null>(null);
    const [link2, setLink2] = useState<string | null>(null);
    const [followers, setFollowers] = useState(0);
    const [following, setFollowing] = useState(0);
    const [isPrivate, setIsPrivate] = useState(false);
    const [canViewContent, setCanViewContent] = useState(true);

    const [hostedEvents, setHostedEvents] = useState<any[]>([]);
    const [likedEvents, setLikedEvents] = useState<any[]>([]);
    const [userStories, setUserStories] = useState<any[]>([]);
    const [hostedVisible, setHostedVisible] = useState(PAGE_SIZE);
    const [likedVisible, setLikedVisible] = useState(PAGE_SIZE);

    const { theme, toggleTheme } = useAppTheme();

    useEffect(() => { load(); }, []);

    async function load() {
        try {
            const [profileData, storedUser] = await Promise.all([
                getUserProfile(followingId),
                AsyncStorage.getItem("user").then((s) => (s ? JSON.parse(s) : null)),
            ]);

            setUsername(profileData.username ?? "");
            setDisplayName(profileData.display_name ?? profileData.username ?? "");
            setAvatar(profileData.avatar ?? null);
            setBio(profileData.bio ?? null);
            setLink1(profileData.link_1 ?? null);
            setLink2(profileData.link_2 ?? null);
            setFollowers(profileData.followers ?? 0);
            setFollowing(profileData.following ?? 0);
            setIsPrivate(profileData.private ?? false);
            setCanViewContent(profileData.canViewContent ?? true);
            setIsOwnProfile(!followingId || followingId === storedUser?.id);

            const [events, liked, stories] = await Promise.all([
                fetchHostedEvents(followingId).catch(() => []),
                // Only fetch own liked events — backend has no per-user liked-events endpoint
                followingId ? Promise.resolve([]) : fetchLikedEvents().catch(() => []),
                fetchStoryByUser(followingId).catch(() => []),
            ]);
            setHostedEvents(events ?? []);
            setLikedEvents(liked ?? []);
            setUserStories(Array.isArray(stories) ? stories : []);
        } catch (err) {
            console.error("Failed to load profile", err);
        }
    }

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [followingId]);

    const showMoreHosted = () => setHostedVisible((v) => v + PAGE_SIZE);
    const showMoreLiked  = () => setLikedVisible((v) => v + PAGE_SIZE);

    const follow = async () => {
        if (!followingId || isOwnProfile) return;
        setFollowed(true);
        try { await followUser(followingId); }
        catch { setFollowed(false); }
    };

    const unfollow = () => setFollowed(false);

    const handleShare = async () => {
        try {
            await Share.share({ message: `Check out ${displayName || username}'s profile on Fuego` });
        } catch (err) {
            console.error("Share failed", err);
        }
    };

    const openSettings = () => navigation.navigate("Settings");

    return {
        username, displayName, avatar, bio, link1, link2,
        followers, following,
        hostedEvents, likedEvents, userStories,
        hostedVisible, likedVisible,
        showMoreHosted, showMoreLiked,
        followed, isOwnProfile,
        isPrivate, canViewContent,
        follow, unfollow,
        handleShare,
        openSettings,
        theme, toggleTheme,
        refreshing, onRefresh,
    };
}
