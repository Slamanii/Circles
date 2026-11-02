import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { Colors, getColors } from "../../shared/theme";

type Props = {
    address: string;
    displayName: string;
    avatar: string | null;
    onChatPress: () => void;
    onNotificationsPress: () => void;
    onLocationPress: () => void;
    onAvatarPress: () => void;
};

export default function HomeHeader({
    address, displayName, avatar,
    onChatPress, onNotificationsPress, onLocationPress, onAvatarPress,
}: Props) {
    const C = getColors(useAppTheme().theme);
    return (
        <View style={[styles.container, { backgroundColor: C.background }]}>
            <LinearGradient
                colors={[Colors.purple + "66", Colors.pink + "26", C.background]}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.topRow}>
                <View style={styles.avatarGlowWrap}>
                    <View style={[styles.glowCircle, styles.glowPurple]} />
                    <View style={[styles.glowCircle, styles.glowPink]} />
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                    <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.8}>
                        {avatar ? (
                            <Image source={{ uri: avatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: C.surface }]}>
                                <Ionicons name="person" size={18} color={C.textSecondary} />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.icons}>
                    <TouchableOpacity onPress={onNotificationsPress} style={styles.iconBtn}>
                        <Ionicons name="notifications-outline" size={22} color={C.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onChatPress} style={styles.iconBtn}>
                        <Ionicons name="chatbubble-outline" size={22} color={C.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={[styles.greeting, { color: C.text }]} numberOfLines={1}>
                Hi, {displayName || "there"}
            </Text>

            <TouchableOpacity style={styles.locationRow} onPress={onLocationPress} activeOpacity={0.7}>
                <Ionicons name="location-sharp" size={13} color={C.accentText} />
                <Text style={[styles.address, { color: C.textSecondary }]} numberOfLines={1}>
                    {address || "Set location"}
                </Text>
                <Ionicons name="chevron-down" size={11} color={C.textSecondary} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 14,
        overflow: "hidden",
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    avatarGlowWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
    glowCircle: {
        position: "absolute",
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    glowPurple: { backgroundColor: Colors.purple, opacity: 0.6, left: -10, top: -8 },
    glowPink: { backgroundColor: Colors.pink, opacity: 0.4, right: -10, bottom: -8 },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    avatarFallback: { alignItems: "center", justifyContent: "center" },
    icons: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    iconBtn: {
        padding: 6,
    },
    greeting: {
        fontSize: 22,
        fontWeight: "700",
        marginTop: 18,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 10,
        alignSelf: "flex-start",
    },
    address: {
        fontSize: 13,
    },
});
