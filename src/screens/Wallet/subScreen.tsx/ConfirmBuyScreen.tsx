import { View, Text, TouchableOpacity } from "react-native";

export default function ConfirmBuyScreen({ navigation, route }: any) {
  const { token, amount } = route.params;

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#424040" }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 18 }}>←</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>Confirm Purchase</Text>
      <Text style={{ marginBottom: 8 }}>Token: {token.name}</Text>
      <Text style={{ marginBottom: 8 }}>Amount: ${amount}</Text>
    </View>
  );
}
