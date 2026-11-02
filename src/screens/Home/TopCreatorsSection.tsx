import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";
import { fetchTopCreators, TopCreator } from "../../services/user";

type Props = {
    title: string;
    accountType: "artist" | "host";
    previewCount?: number;
    onSeeAll: () => void;
    onPressUser: (userId: string) => void;
};

export default function TopCreatorsSection({ title, accountType, previewCount = 4, onSeeAll, onPressUser }: Props) {
    const C = getColors(useAppTheme().theme);
    const [creators, setCreators] = useState<TopCreator[]>([]);

    useEffect(() => {
        fetchTopCreators(accountType, previewCount)
            .then(setCreators)
            .catch(() => setCreators([]));
    }, [accountType, previewCount]);

    if (!creators.length) return null;

    return (
        <View style={styles.section}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: C.text }]}>{title}</Text>
                <TouchableOpacity onPress={onSeeAll}>
                    <Text style={[styles.seeAll, { color: C.accentText }]}>See all</Text>
                </TouchableOpacity>
            </View>
            {creators.map((c) => (
                <TouchableOpacity key={c.id} style={styles.row} onPress={() => onPressUser(c.id)}>
                    {c.avatar ? (
                        <Image source={{ uri: c.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: C.surface }]} />
                    )}
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>
                            {c.display_name || c.username}
                        </Text>
                        <Text style={[styles.count, { color: C.textSecondary }]}>
                            {c.eventCount} event{c.eventCount === 1 ? "" : "s"}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    section: { marginBottom: 20, paddingHorizontal: 16 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    title: { fontSize: 17, fontWeight: "800" },
    seeAll: { fontSize: 13, fontWeight: "700" },
    row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
    avatar: { width: 44, height: 44, borderRadius: 22 },
    name: { fontSize: 15, fontWeight: "700" },
    count: { fontSize: 12, marginTop: 2 },
});
