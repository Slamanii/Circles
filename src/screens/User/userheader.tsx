import { useNavigation } from "@react-navigation/native";
import { Button, StyleSheet, View } from "react-native";

export function UserScreenHeader() {

    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            <Button title="Add Event" onPress={() => navigation.navigate("add-event")} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 50,
        marginBottom: 20,
    },
});
