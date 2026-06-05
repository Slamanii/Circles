import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WalletTokenRow } from "../../../components/wallet/WalletTokenRow";
import { Token } from "../../../../shared/Types";

export default function SendScreen({ navigation, route }: any) {
    const tokens: Token[] = route.params?.tokens ?? [];

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backText}>←</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Select Token</Text>

            <FlatList
                data={tokens}
                keyExtractor={t => t.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <WalletTokenRow
                        token={item}
                        onPress={() => navigation.navigate("SendForm", {
                            token: item,
                            walletAddress: route.params?.walletAddress ?? "",
                        })}
                    />
                )}
                ListEmptyComponent={
                    <Text style={styles.empty}>No tokens available</Text>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#2E2D2D" },
    backBtn:   { marginTop: 56, marginLeft: 20, marginBottom: 8 },
    backText:  { color: "#fff", fontSize: 22 },
    title:     { color: "#fff", fontSize: 22, fontWeight: "700", marginLeft: 20, marginBottom: 20 },
    list:      { paddingHorizontal: 16, paddingBottom: 40 },
    empty:     { color: "#6B7280", textAlign: "center", marginTop: 60, fontSize: 14 },
});
