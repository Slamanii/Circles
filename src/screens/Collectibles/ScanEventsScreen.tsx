import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";
import { fetchScannableEvents } from "../../services/eventService";

type ScannableEvent = {
    id: string;
    title: string;
    event_date: string | null;
    venue: string;
    flyer_card: string[] | null;
    status: "active" | "expired" | "cancelled";
};

export default function ScanEventsScreen() {
    const navigation = useNavigation<any>();
    const C = getColors(useAppTheme().theme);
    const [events, setEvents] = useState<ScannableEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchScannableEvents()
            .then((data: any) => setEvents(data ?? []))
            .catch(() => setEvents([]))
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
                <Text style={{ fontSize: 17, fontWeight: "700", color: C.text }}>Scan Tickets</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={C.textSecondary} />
            ) : (
                <FlatList
                    data={events}
                    keyExtractor={(e) => e.id}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 10 }}
                    ListEmptyComponent={
                        <View style={{ alignItems: "center", paddingTop: 60, gap: 10 }}>
                            <Ionicons name="qr-code-outline" size={40} color={C.textMuted} />
                            <Text style={{ color: C.textMuted, fontSize: 14, textAlign: "center" }}>
                                No events to scan for yet — you'll see events you created or were granted scan access to here.
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={{
                                flexDirection: "row", alignItems: "center", gap: 12,
                                backgroundColor: C.card, borderRadius: 16, padding: 14,
                            }}
                            onPress={() => navigation.navigate("ScanTicket", { eventId: item.id, eventTitle: item.title })}
                            disabled={item.status === "cancelled"}
                        >
                            {item.flyer_card?.[0] ? (
                                <Image source={{ uri: item.flyer_card[0] }} style={{ width: 48, height: 48, borderRadius: 10 }} />
                            ) : (
                                <View style={{ width: 48, height: 48, borderRadius: 10, backgroundColor: C.surface }} />
                            )}
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: C.text, fontWeight: "700", fontSize: 15 }} numberOfLines={1}>
                                    {item.title}
                                </Text>
                                <Text style={{ color: C.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                                    {item.venue}
                                </Text>
                                {item.status === "cancelled" && (
                                    <Text style={{ color: "#D64545", fontSize: 11, fontWeight: "700", marginTop: 2 }}>
                                        Cancelled — scanning disabled
                                    </Text>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}
