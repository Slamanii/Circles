import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { validateTicket } from "../../services/collectiblesService";
import { Colors } from "../../shared/theme";

type ScanResult =
    | { kind: "success"; tierName: string | null; groupSize: number | null }
    | { kind: "error"; message: string };

export default function ScanTicketScreen({ route }: any) {
    const { eventId, eventTitle } = route.params as { eventId: string; eventTitle: string };
    const navigation = useNavigation<any>();
    const [permission, requestPermission] = useCameraPermissions();
    const [result, setResult] = useState<ScanResult | null>(null);
    const [checking, setChecking] = useState(false);
    const lockRef = useRef(false);

    const handleScanned = async ({ data }: { data: string }) => {
        if (lockRef.current) return;
        lockRef.current = true;
        setChecking(true);
        try {
            const res = await validateTicket(eventId, data);
            setResult({ kind: "success", tierName: res.tierName, groupSize: res.groupSize });
        } catch (err) {
            setResult({ kind: "error", message: err instanceof Error ? err.message : "Could not validate ticket" });
        } finally {
            setChecking(false);
        }
    };

    const scanAgain = () => {
        setResult(null);
        lockRef.current = false;
    };

    if (!permission) {
        return <View style={{ flex: 1, backgroundColor: "#000" }} />;
    }

    if (!permission.granted) {
        return (
            <View style={{ flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center", padding: 24, gap: 16 }}>
                <Text style={{ color: "white", textAlign: "center", fontSize: 15 }}>
                    Camera access is needed to scan tickets.
                </Text>
                <TouchableOpacity onPress={requestPermission} style={{ backgroundColor: Colors.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}>
                    <Text style={{ color: Colors.black, fontWeight: "700" }}>Grant Camera Access</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#000" }}>
            <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={result || checking ? undefined : handleScanned}
            />

            <View style={{
                position: "absolute", top: 56, left: 16, right: 16,
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            }}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="chevron-back" size={26} color="white" />
                </TouchableOpacity>
                <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }} numberOfLines={1}>
                    {eventTitle}
                </Text>
                <View style={{ width: 26 }} />
            </View>

            <View style={{
                position: "absolute", left: "15%", right: "15%", top: "28%", bottom: "40%",
                borderWidth: 3, borderColor: "rgba(255,255,255,0.8)", borderRadius: 24,
            }} />

            {checking && (
                <View style={{ position: "absolute", bottom: 80, alignSelf: "center" }}>
                    <ActivityIndicator color="white" />
                </View>
            )}

            {result && (
                <View style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    backgroundColor: result.kind === "success" ? "#1F6B3A" : "#8A2A2A",
                    padding: 24, paddingBottom: 40, gap: 12,
                }}>
                    <Ionicons
                        name={result.kind === "success" ? "checkmark-circle" : "close-circle"}
                        size={40}
                        color="white"
                        style={{ alignSelf: "center" }}
                    />
                    {result.kind === "success" ? (
                        <Text style={{ color: "white", fontWeight: "700", fontSize: 16, textAlign: "center" }}>
                            {result.groupSize ? `Admit — group of ${result.groupSize}` : "Admit"}
                            {result.tierName ? ` (${result.tierName})` : ""}
                        </Text>
                    ) : (
                        <Text style={{ color: "white", fontWeight: "700", fontSize: 16, textAlign: "center" }}>
                            {result.message}
                        </Text>
                    )}
                    <TouchableOpacity
                        onPress={scanAgain}
                        style={{ backgroundColor: "rgba(255,255,255,0.2)", paddingVertical: 12, borderRadius: 12, alignItems: "center" }}
                    >
                        <Text style={{ color: "white", fontWeight: "700" }}>Scan Next Ticket</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
