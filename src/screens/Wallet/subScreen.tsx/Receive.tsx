import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { Token } from "../../../../shared/Types";

type Props = {
  navigation: any;
  route: {
    params: {
      tokens: Token[];
    };
  };
};

export default function ReceiveScreen({ route }: Props) {
  const { tokens } = route.params;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>
        Receive
      </Text>

      <FlatList
        data={tokens}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ marginBottom: 16 }}>
            <Text>{item.name}</Text>
            <Text>Tap to view address</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}