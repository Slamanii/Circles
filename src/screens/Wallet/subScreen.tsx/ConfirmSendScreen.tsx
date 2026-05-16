import { View, Text, FlatList, TouchableOpacity } from "react-native";

export default function ConfirmSendScreen({ route }: any) {
  const { token, amount, address } = route.params;

  return (
    <View style={{ padding: 20 }}>
      <Text>Confirm Transaction</Text>
      <Text>Token: {token.name}</Text>
      <Text>Amount: {amount}</Text>
      <Text>To: {address}</Text> {/* add confirm button */}
    </View>
  );
}