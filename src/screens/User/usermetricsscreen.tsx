import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
    followers: number;
    following: number;
    likes: number;
    onFollowersPress: () => void;
    onFollowingPress: () => void;
};

export default function UserMetrics({ followers, following, likes, onFollowersPress, onFollowingPress }: Props) {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.column} onPress={onFollowersPress}>
                <Text style={styles.count}>{followers}</Text>
                <Text style={styles.label}>Followers</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.column} onPress={onFollowingPress}>
                <Text style={styles.count}>{following}</Text>
                <Text style={styles.label}>Following</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.column}>
                <Text style={styles.count}>{likes}</Text>
                <Text style={styles.label}>Likes</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 16,
        borderTopWidth: 0.5,
        borderBottomWidth: 0.5,
        borderColor: "#ddd",
        marginVertical: 12,
    },
    column: {
        flex: 1,
        alignItems: "center",
    },
    divider: {
        width: 0.5,
        height: 32,
        backgroundColor: "#ddd",
    },
    count: {
        fontSize: 20,
        fontWeight: "700",
    },
    label: {
        fontSize: 13,
        color: "#666",
        marginTop: 2,
    },
});
