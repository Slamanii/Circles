import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";
import { fetchTopCreators, TopCreator } from "../../services/user";

export default function ArtistsScreen() {
    const navigation = useNavigation<any>();
    const C = getColors(useAppTheme().theme);
    const [creators, setCreators] = useState<TopCreator[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTopCreators("artist")
            .then(setCreators)
            .catch(() => setCreators([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: C.background }}>
            <View style={{
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
            }}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={24} color={C.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>Artists</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={C.accentText} />
            ) : (
                <FlatList
                    data={creators}
                    keyExtractor={(c) => c.id}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 10 }}
                    ListEmptyComponent={
                        <View style={{ alignItems: "center", paddingTop: 60, gap: 10 }}>
                            <Ionicons name="mic-outline" size={40} color={C.textMuted} />
                            <Text style={{ color: C.textMuted, fontSize: 14 }}>No artists yet</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.card, borderRadius: 16, padding: 14 }}
                            onPress={() => navigation.navigate("UserProfile", { followingId: item.id })}
                        >
                            {item.avatar ? (
                                <Image source={{ uri: item.avatar }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                            ) : (
                                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.surface }} />
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: C.text, fontWeight: "700", fontSize: 15 }} numberOfLines={1}>
                                    {item.display_name || item.username}
                                </Text>
                                <Text style={{ color: C.textSecondary, fontSize: 12, marginTop: 2 }}>
                                    {item.eventCount} event{item.eventCount === 1 ? "" : "s"}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}
