import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-gifted-charts";
import { fetchChartData } from "../../../services/wallet/chart";
import { useAppTheme } from "../../../context/ThemeContext";
import { Colors, getColors } from "../../../shared/theme";

const RANGES = [
    { key: "1D", days: 1 },
    { key: "1W", days: 7 },
    { key: "1M", days: 30 },
    { key: "3M", days: 90 },
] as const;

export default function ChartScreen({ navigation, route }: any) {
    const { token } = route.params;
    const C = getColors(useAppTheme().theme);

    const [points, setPoints] = useState<{ time: number; value: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<typeof RANGES[number]["key"]>("1W");

    useEffect(() => {
        let cancelled = false;
        const days = RANGES.find(r => r.key === range)!.days;

        setLoading(true);
        fetchChartData(token.id, days)
            .then((prices) => { if (!cancelled) setPoints(prices); })
            .catch((err) => console.log("Chart error:", err))
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [token.id, range]);

    const screenWidth = Dimensions.get("window").width;
    const latest = points[points.length - 1]?.value;
    const first = points[0]?.value;
    const changePct = first && latest ? ((latest - first) / first) * 100 : null;
    const isUp = (changePct ?? 0) >= 0;

    const chartData = points.map(p => ({ value: p.value }));

    return (
        <View style={{ flex: 1, backgroundColor: C.background, paddingTop: 56 }}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginBottom: 20 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={24} color={C.text} />
                </TouchableOpacity>
                {token.logoURI && (
                    <Image source={{ uri: token.logoURI }} style={{ width: 28, height: 28, borderRadius: 14, marginLeft: 14 }} />
                )}
                <Text style={{ fontSize: 17, fontWeight: "700", color: C.text, marginLeft: 10 }}>
                    {token.name} <Text style={{ color: C.textSecondary, fontWeight: "500" }}>({token.symbol})</Text>
                </Text>
            </View>

            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
                <Text style={{ fontSize: 30, fontWeight: "800", color: C.text }}>
                    {latest != null ? `$${latest.toFixed(latest < 1 ? 6 : 2)}` : "—"}
                </Text>
                {changePct != null && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <Ionicons name={isUp ? "caret-up" : "caret-down"} size={13} color={isUp ? "#2F8F5B" : "#D64545"} />
                        <Text style={{ color: isUp ? "#2F8F5B" : "#D64545", fontSize: 13, fontWeight: "700" }}>
                            {Math.abs(changePct).toFixed(2)}% · {RANGES.find(r => r.key === range)!.key}
                        </Text>
                    </View>
                )}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={C.accentText} style={{ marginTop: 60 }} />
            ) : chartData.length > 1 ? (
                <LineChart
                    data={chartData}
                    width={screenWidth - 40}
                    height={220}
                    thickness={2.5}
                    color={C.accentText}
                    curved
                    areaChart
                    startFillColor={C.accentText}
                    endFillColor={C.accentText}
                    startOpacity={0.25}
                    endOpacity={0}
                    hideDataPoints
                    hideAxesAndRules
                    hideYAxisText
                    initialSpacing={0}
                    endSpacing={0}
                    adjustToWidth
                    noOfSections={3}
                />
            ) : (
                <Text style={{ color: C.textSecondary, textAlign: "center", marginTop: 60 }}>
                    No price data available
                </Text>
            )}

            <View style={{ flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 24 }}>
                {RANGES.map((r) => (
                    <TouchableOpacity
                        key={r.key}
                        onPress={() => setRange(r.key)}
                        style={{
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 20,
                            backgroundColor: range === r.key ? Colors.accent : C.card,
                        }}
                    >
                        <Text style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: range === r.key ? Colors.black : C.textSecondary,
                        }}>
                            {r.key}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}
