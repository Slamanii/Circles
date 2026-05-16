import { FlatList, Text, TouchableOpacity } from "react-native";


export default function SendScreen({ navigation, route }: any) {
  const { tokens } = route.params;

  return (
    <FlatList
      data={tokens}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("SendForm", { token: item })
          }
        >
          <Text>{item.name}</Text>
        </TouchableOpacity>
      )}
    />
  );
}