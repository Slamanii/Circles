import { useState } from "react";
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

type Props = Omit<TextInputProps, "secureTextEntry" | "style"> & {
    value: string;
};

export default function PasswordInput({ value, ...rest }: Props) {
    const [visible, setVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!value) return;
        await Clipboard.setStringAsync(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    };

    return (
        <View style={styles.wrap}>
            <TextInput
                style={styles.input}
                placeholderTextColor="#555"
                value={value}
                secureTextEntry={!visible}
                {...rest}
            />
            <View style={styles.actions}>
                <TouchableOpacity onPress={handleCopy} disabled={!value} hitSlop={8}>
                    <Ionicons
                        name={copied ? "checkmark" : "copy-outline"}
                        size={18}
                        color={value ? "#9CA3AF" : "#3A3A3A"}
                    />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setVisible((v) => !v)} hitSlop={8}>
                    <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={18} color="#9CA3AF" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1A1A1A",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#2A2A2A",
        paddingRight: 14,
    },
    input: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 15,
        color: "#fff",
    },
    actions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
});
