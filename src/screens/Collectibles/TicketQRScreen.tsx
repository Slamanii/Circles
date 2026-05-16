import { useNavigation } from "@react-navigation/native";
import { Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function TicketQRScreen({ route }: any) {
    const { assetId, ticketName } = route.params;
    const navigation = useNavigation<any>();

    return (
        <View style={{ flex: 1, backgroundColor: "#0F172A", justifyContent: "center", alignItems: "center", padding: 24 }}>
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ position: "absolute", top: 56, left: 16 }}
            >
                <Text style={{ color: "white", fontSize: 18 }}>←</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 18, fontWeight: "bold", color: "white", marginBottom: 32 }}>
                {ticketName}
            </Text>

            {/* QR encodes the asset_id for venue verification */}
            <QRCode value={assetId} size={220} backgroundColor="#0F172A" color="white" />

            <Text style={{ color: "#64748B", fontSize: 11, marginTop: 24, textAlign: "center" }}>
                Show this code at the venue
            </Text>
        </View>
    );
}
