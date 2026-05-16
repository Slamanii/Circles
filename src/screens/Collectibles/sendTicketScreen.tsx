import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Collectible, getUserByUsername, transferTicket } from "../../services/collectiblesService";

export default function SendTicketScreen({ route }: any) {
    const ticket: Collectible = route.params.ticket;
    const navigation = useNavigation<any>();
    const [recipientUsername, setRecipientUsername] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!recipientUsername.trim()) {
            Alert.alert("Enter a username");
            return;
        }

        setLoading(true);
        try {
            const recipient = await getUserByUsername(recipientUsername.trim());
            if (!recipient) {
                Alert.alert("User not found", `No account found for @${recipientUsername}`);
                return;
            }

            await transferTicket(ticket.asset_id, recipient.id);

            Alert.alert("Sent!", `Ticket sent to @${recipientUsername}`);
            navigation.goBack();
        } catch (err: any) {
            Alert.alert("Transfer failed", err.message ?? "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#0F172A", padding: 24 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 24 }}>
                <Text style={{ color: "white", fontSize: 18 }}>←</Text>
            </TouchableOpacity>

            <Text style={{ color: "white", fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>
                Send Ticket
            </Text>
            <Text style={{ color: "#94A3B8", marginBottom: 24 }}>
                {ticket.events?.title ?? "Ticket"}
            </Text>

            <TextInput
                placeholder="Enter recipient username"
                placeholderTextColor="#64748B"
                value={recipientUsername}
                onChangeText={setRecipientUsername}
                autoCapitalize="none"
                style={{
                    backgroundColor: "#1E293B",
                    color: "white",
                    padding: 14,
                    borderRadius: 10,
                    marginBottom: 16,
                }}
            />

            <TouchableOpacity
                onPress={handleSend}
                disabled={loading}
                style={{
                    backgroundColor: loading ? "#334155" : "#3B82F6",
                    padding: 14,
                    borderRadius: 10,
                    alignItems: "center",
                }}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={{ color: "white", fontWeight: "600" }}>Send Ticket</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}
