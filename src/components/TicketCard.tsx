import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
    ticketId: string;
    send: () => void;
    showQR: () => void;
    more: () => void;
};

export default function TicketControlCard({ ticketId, send, showQR, more }: Props) {
    const [pinned, setPinned] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem("pinnedTickets").then((stored) => {
            if (stored) {
                const ids: string[] = JSON.parse(stored);
                setPinned(ids.includes(ticketId));
            }
        });
    }, [ticketId]);

    const handlePin = async () => {
        const stored = await AsyncStorage.getItem("pinnedTickets");
        const ids: string[] = stored ? JSON.parse(stored) : [];
        const next = ids.includes(ticketId)
            ? ids.filter((id) => id !== ticketId)
            : [...ids, ticketId];
        await AsyncStorage.setItem("pinnedTickets", JSON.stringify(next));
        setPinned(next.includes(ticketId));
    };

    return (
        <View style={styles.row}>
            <TouchableOpacity style={styles.btn} onPress={send}>
                <Text style={styles.label}>Send</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btn} onPress={showQR}>
                <Text style={styles.label}>QR</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, pinned && styles.btnActive]} onPress={handlePin}>
                <Text style={[styles.label, pinned && styles.labelActive]}>
                    {pinned ? "Pinned" : "Pin"}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btn} onPress={more}>
                <Text style={styles.label}>More</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        gap: 10,
        marginTop: 8,
    },
    btn: {
        flex: 1,
        backgroundColor: "#1E293B",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    btnActive: {
        backgroundColor: "#1D4ED8",
    },
    label: {
        color: "#94A3B8",
        fontWeight: "600",
        fontSize: 13,
    },
    labelActive: {
        color: "white",
    },
});
