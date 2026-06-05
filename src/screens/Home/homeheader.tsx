import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { Colors, getColors } from "../../shared/theme";

type Props = {
    address: string;
    onChatPress: () => void;
    onNotificationsPress: () => void;
    onLocationPress: () => void;
};

export default function HomeHeader({ address, onChatPress, onNotificationsPress, onLocationPress }: Props) {
    const C = getColors(useAppTheme().theme);
    return (
        <View style={[styles.container, { backgroundColor: C.background }]}>
            <TouchableOpacity style={styles.locationRow} onPress={onLocationPress} activeOpacity={0.7}>
                <Ionicons name="location-sharp" size={13} color={Colors.accent} />
                <Text style={[styles.address, { color: C.textSecondary }]} numberOfLines={1}>
                    {address || "Set location"}
                </Text>
                <Ionicons name="chevron-down" size={11} color={C.textSecondary} />
            </TouchableOpacity>

            <View style={styles.icons}>
                <TouchableOpacity onPress={onNotificationsPress} style={styles.iconBtn}>
                    <Ionicons name="notifications-outline" size={22} color={C.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onChatPress} style={styles.iconBtn}>
                    <Ionicons name="chatbubble-outline" size={22} color={C.text} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 10,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        flex: 1,
    },
    address: {
        fontSize: 13,
        flex: 1,
    },
    icons: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    iconBtn: {
        padding: 6,
    },
});
