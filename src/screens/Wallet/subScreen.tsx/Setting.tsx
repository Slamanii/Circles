import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function WalletSettingsScreen() {
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#424040" }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 18 }}>←</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>Wallet Settings</Text>
      <Text style={{ marginBottom: 12 }}>• Security</Text>
      <Text style={{ marginBottom: 12 }}>• Recovery Phrase</Text>
      <Text style={{ marginBottom: 12 }}>• Notifications</Text>
      <Text style={{ marginBottom: 12 }}>• Preferred Currency</Text>
      <Text style={{ marginBottom: 12 }}>• Logout</Text>
    </View>
  );
}
