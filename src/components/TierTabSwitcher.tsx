import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { Colors, Radius, getColors } from "../shared/theme";
import { TicketTier } from "../hooks/useEvents";

const TIER_ORDER = ["Base", "VIP", "VIP++"] as const;

type Props = {
    tiers: TicketTier[];
    active: string;
    onChange: (name: string) => void;
};

export default function TierTabSwitcher({ tiers, active, onChange }: Props) {
    const C = getColors(useAppTheme().theme);

    return (
        <View style={[styles.wrap, { backgroundColor: C.card }]}>
            {TIER_ORDER.map((name) => {
                const isActive = active === name;
                const exists = tiers.some((t) => t.name === name);

                return (
                    <TouchableOpacity
                        key={name}
                        style={[styles.tab, isActive && { backgroundColor: Colors.accent }]}
                        onPress={() => onChange(name)}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                { color: isActive ? Colors.white : C.textSecondary },
                                !exists && !isActive && styles.tabTextMuted,
                            ]}
                        >
                            {name}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export { TIER_ORDER };

const styles = StyleSheet.create({
    wrap: {
        flexDirection: "row",
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: Radius.full,
        padding: 4,
        gap: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: Radius.full,
        alignItems: "center",
    },
    tabText: {
        fontSize: 13,
        fontWeight: "700",
    },
    tabTextMuted: {
        opacity: 0.4,
    },
});
