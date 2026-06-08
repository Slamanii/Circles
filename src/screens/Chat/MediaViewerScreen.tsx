import { Video, ResizeMode } from "expo-av";
import { useRef } from "react";
import {
    Dimensions,
    Image,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: W, height: H } = Dimensions.get("window");

export default function MediaViewerScreen({ route, navigation }: any) {
    const { uri, type } = route.params as { uri: string; type: "image" | "video" };
    const videoRef = useRef<Video>(null);

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            {type === "video" ? (
                <Video
                    ref={videoRef}
                    source={{ uri }}
                    style={styles.media}
                    resizeMode={ResizeMode.CONTAIN}
                    useNativeControls
                    shouldPlay
                />
            ) : (
                <Image
                    source={{ uri }}
                    style={styles.media}
                    resizeMode="contain"
                />
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        alignItems: "center",
        justifyContent: "center",
    },
    media: {
        width: W,
        height: H,
    },
    closeBtn: {
        position: "absolute",
        top: 52,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.5)",
        alignItems: "center",
        justifyContent: "center",
    },
});
