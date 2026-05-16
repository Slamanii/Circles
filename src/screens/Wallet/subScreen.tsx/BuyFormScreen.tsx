import { View, Text, TextInput, Button } from "react-native";
import { useState } from "react";

export default function BuyFormScreen({ navigation, route }: any) {
  const { token } = route.params;
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");

  return (
    <View style={{ padding: 20 }}>
      <Text>Send {token.name}</Text>

      <TextInput
        placeholder="Recipient address"
        value={address}
        onChangeText={setAddress}
        style={{ borderWidth: 1, marginBottom: 12 }}
      />

      <TextInput
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        style={{ borderWidth: 1, marginBottom: 12 }}
      />

      <Button
        title="Continue"
        onPress={() =>
          navigation.navigate("ConfirmBuy", {
            token,
            amount,
            address,
          })
        }
      />
    </View>
  );
}