import { View, Text, TouchableOpacity, TextInput } from "react-native"

export function MessageInput({
    value,
    onChange,
    onSend,
    onPickImage,
    onGif,
    onRecordAudio,
}: any) {

    return (
        <View style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 10,
            borderTopWidth: 0.5,
            borderTopColor: "#ddd",
            backgroundColor: "white",
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
                style={{
                    flex: 1,
                    backgroundColor: "#f2f2f2",
                    marginHorizontal: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 20,
                }}
            />
            <TouchableOpacity onPress={onRecordAudio}>
                <Text style={{ fontSize: 20 }}>🎙️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSend}>
                <Text style={{ fontSize: 18, marginLeft: 10 }}>Send</Text>
            </TouchableOpacity>
        </View>
    );
}