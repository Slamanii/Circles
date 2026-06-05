import { View, Text, TouchableOpacity, TextInput } from "react-native"
import { useAppTheme } from "../../context/ThemeContext"
import { getColors } from "../../shared/theme"

export function MessageInput({
    value,
    onChange,
    onSend,
    onPickImage,
    onGif,
    onRecordAudio,
    recording = false,
}: any) {
    const C = getColors(useAppTheme().theme);

    return (
        <View style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 10,
            borderTopWidth: 0.5,
            borderTopColor: C.border,
            backgroundColor: C.card,
        }}
        >
            <TouchableOpacity onPress={onGif}>
                <Text style={{ fontSize: 20 }}>😀</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onPickImage}>
                <Text style={{ fontSize: 20, marginLeft: 10 }}>🖼️</Text>
            </TouchableOpacity>

            <TextInput
                value={value}
                onChangeText={onChange}
                placeholder=""
                placeholderTextColor={C.textMuted}
                style={{
                    flex: 1,
                    backgroundColor: C.surface,
                    marginHorizontal: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                    color: C.text,
                }}
            />
            <TouchableOpacity onPress={onRecordAudio}>
                <Text style={{ fontSize: 20, opacity: recording ? 0.4 : 1 }}>🎙️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSend}>
                <Text style={{ fontSize: 18, marginLeft: 10, color: C.accent, fontWeight: "600" }}>Send</Text>
            </TouchableOpacity>
        </View>
    );
}