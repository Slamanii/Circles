import { View, Text, FlatList, TouchableOpacity } from "react-native";

export default function WalletSettingsScreen() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 22 }}>Wallet Settings</Text>

      <Text>• Security</Text>
      <Text>• Recovery Phrase</Text>
      <Text>• Notifications</Text>
      <Text>• Preferred Currency</Text>
      <Text>• Logout</Text>
    </View>
  );
}