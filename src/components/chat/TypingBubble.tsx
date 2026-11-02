import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

function Dot({ delay, color }: { delay: number; color: string }) {
    const bounce = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(bounce, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(bounce, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.delay(600 - delay),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [bounce, delay]);

    return (
        <Animated.View
            style={[
                styles.dot,
                { backgroundColor: color, transform: [{ translateY: bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] },
            ]}
        />
    );
}

export function TypingBubble({ label }: { label: string }) {
    return (
        <View style={styles.row}>
            <View style={[styles.bubble, { backgroundColor: "rgba(0,0,0,0.35)" }]}>
                <Dot delay={0} color="rgba(255,255,255,0.7)" />
                <Dot delay={150} color="rgba(255,255,255,0.7)" />
                <Dot delay={300} color="rgba(255,255,255,0.7)" />
            </View>
            <Text style={[styles.label, { color: "rgba(255,255,255,0.6)" }]} numberOfLines={1}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { paddingHorizontal: 12, paddingBottom: 6 },
    bubble: {
        flexDirection: "row",
        alignSelf: "flex-start",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
    },
    dot: { width: 6, height: 6, borderRadius: 3 },
    label: { fontSize: 11, marginTop: 3, marginLeft: 2 },
});
