import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from 'react';
import { Share } from "react-native";
import { fetchFollowers, fetchFollowing, fetchHostedEvents, followUser, getUser } from "../../services/user";

export function useUserLogic(followingId?: string) {

    const navigation = useNavigation<any>();

    const [followed, setFollowed] = useState(false);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [username, setUsername] = useState<string>("");
    const [followers, setFollowers] = useState<number>(0);
    const [following, setFollowing] = useState<number>(0);
    const [likes, setLikes] = useState<number>(0);
    const [showSettings, setShowSettings] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        loadUserData();
    }, [])

    async function loadUserData() {
        try {
            const data = await getUser();
            setUsername(data.username);
            setFollowers(data.followers ?? 0);
            setFollowing(data.following ?? 0);
            setLikes(data.likes ?? 0);
            // if no followingId, or it matches the logged-in user — own profile
            setIsOwnProfile(!followingId || followingId === data.id);
        } catch (err) {
            console.error("Failed to get user info", err);
        }
    }

    const follow = async () => {
        if (!followingId || isOwnProfile) return;
        setFollowed(true);
        try {
            await followUser(followingId);
        } catch {
            setFollowed(false);
        }
    }

    const unfollow = () => setFollowed(false);

    const fetchFollowersCount = async () => {
        try {
            const data = await fetchFollowers();
            setFollowers(data?.length ?? 0);
        } catch (err) {
            console.error("Failed to get followers", err);
        }
    }

    const fetchFollowingCount = async () => {
        try {
            const data = await fetchFollowing();
            setFollowing(data?.length ?? 0);
        } catch (err) {
            console.error("Failed to get following", err);
        }
    }

    const fetchMyEvents = async () => {
        try {
            return await fetchHostedEvents();
        } catch (err) {
            console.error("Failed to get hosted events", err);
        }
    }

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out ${username}'s profile on Fuego`,
            });
        } catch (err) {
            console.error("Share failed", err);
        }
    }

    const openSettings = () => setShowSettings(true);
    const closeSettings = () => setShowSettings(false);

    const toggleTheme = () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
    }

    const goToInactiveScreens = (screenName: string) => {
        navigation.navigate("inactive", { screen: screenName });
    }

    const logout = async () => {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
        navigation.replace("login");
    }

    return {
        username,
        followers,
        following,
        likes,
        followed,
        isOwnProfile,
        follow,
        unfollow,
        fetchFollowersCount,
        fetchFollowingCount,
        fetchMyEvents,
        handleShare,
        showSettings,
        openSettings,
        closeSettings,
        toggleTheme,
        theme,
        goToInactiveScreens,
        logout,
    };
}
