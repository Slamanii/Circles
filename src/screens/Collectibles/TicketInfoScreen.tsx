import { useNavigation } from "@react-navigation/native";
import { Alert, Share, Text, TouchableOpacity, View } from "react-native";
import TicketControlCard from "../../components/TicketCard";
import { Collectible } from "../../services/collectiblesService";

export default function TicketInfoScreen({ route }: any) {
    const ticket: Collectible = route.params.ticket;
    const navigation = useNavigation<any>();

    const handleMore = () => {
        Alert.alert(ticket.events?.title ?? "Ticket", undefined, [
            {
                text: "Share",
                onPress: () =>
                    Share.share({
                        message: `I'm going to ${ticket.events?.title ?? "an event"} at ${ticket.events?.venue ?? ""}. Get your ticket on Fuego!`,
                    }),
            },
            {
                text: "Export to wallet",
                onPress: () =>
                    Alert.alert("Coming soon", "On-chain delivery will be available in a future update."),
            },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: "#0F172A" }}>

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ fontSize: 18, color: "white" }}>←</Text>
                </TouchableOpacity>

                <Text style={{ fontSize: 18, fontWeight: "bold", marginLeft: 16, color: "white" }}>
                    {ticket.events?.title ?? "Ticket"}
                </Text>
            </View>

            <View
                style={{
                    width: 120,
                    height: 120,
                    borderRadius: 12,
                    backgroundColor: "#1E293B",
                    alignSelf: "center",
                    marginBottom: 20,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Text style={{ color: "#60A5FA", fontSize: 32 }}>🎟</Text>
            </View>

            <TicketControlCard
                ticketId={ticket.id}
                send={() => navigation.navigate("SendTicket", { ticket })}
                showQR={() =>
                    navigation.navigate("TicketQR", {
                        assetId: ticket.asset_id,
                        ticketName: ticket.events?.title ?? "Ticket",
                    })
                }
                more={handleMore}
            />

            <Text style={{ fontWeight: "bold", marginTop: 20, color: "white" }}>
                Venue
            </Text>
            <Text style={{ color: "#94A3B8", marginTop: 4 }}>
                {ticket.events?.venue ?? "—"}
            </Text>

            <Text style={{ color: "#94A3B8", marginTop: 10 }}>
                Date:{" "}
                {ticket.events?.event_date
                    ? new Date(ticket.events.event_date).toLocaleDateString()
                    : "—"}
            </Text>

            <Text style={{ color: "#94A3B8", marginTop: 6 }}>
                Status: {ticket.status}
            </Text>

            <Text style={{ color: "#64748B", fontSize: 11, marginTop: 6 }}>
                Asset ID: {ticket.asset_id}
            </Text>
        </View>
    );
}
