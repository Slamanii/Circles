import { useState } from "react";
import { Button, FlatList, Image, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";
import { useNavigation } from "@react-navigation/native";
import { useStoryPicker, StoryMedia } from "../../hooks/useStoryUpload";
import { createStory } from "../../services/story";
import { uploadMedia } from "../../services/upload";

export default function StoryUploadScreen() {
    const navigation = useNavigation();
    const C = getColors(useAppTheme().theme);
    const { pickFromCamera, pickFromGallery, loading } = useStoryPicker();
    const [selectedFiles, setSelectedFiles] = useState<StoryMedia[]>([]);
    const [uploading, setUploading] = useState(false);

    const handlePickGallery = async () => {
        const files = await pickFromGallery();
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const handlePickCamera = async () => {
        const files = await pickFromCamera();
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const handleUpload = async () => {
        if (!selectedFiles.length) return;
        setUploading(true);
        try {
            const uploaded = await Promise.all(
                selectedFiles.map(async (f) => {
                    const ext = f.type === "video" ? "mp4" : "jpg";
                    const contentType = f.type === "video" ? "video/mp4" : "image/jpeg";
                    const mediaUrl = await uploadMedia(f.uri, "stories", `story.${ext}`, contentType);
                    return { mediaUrl, type: f.type, caption: f.caption };
                })
            );
            await createStory({ mediaFiles: uploaded });
            setSelectedFiles([]);
            navigation.goBack();
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: C.background }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 18, color: C.text }}>←</Text>
            </TouchableOpacity>
            <Button title="Pick from Gallery" onPress={handlePickGallery} disabled={loading} />
            <Button title="Open Camera" onPress={handlePickCamera} disabled={loading} />
            <FlatList
                data={selectedFiles}
                keyExtractor={(_, i) => String(i)}
                horizontal
                renderItem={({ item }) => (
                    <View style={styles.preview}>
                        {item.type === "image" ? (
                            <Image source={{ uri: item.preview ?? item.uri }} style={styles.previewImage} />
                        ) : (
                            <View style={[styles.preview, { backgroundColor: C.surface, alignItems: "center", justifyContent: "center" }]}>
                                <Text style={{ color: C.textSecondary }}>Video</Text>
                            </View>
                        )}
                    </View>
                )}
            />
            <Button
                title={uploading ? "Uploading..." : "Share Story"}
                onPress={handleUpload}
                disabled={uploading || selectedFiles.length === 0}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, gap: 12 },
    preview: { margin: 8, width: 100, height: 100, borderRadius: 8, overflow: "hidden" },
    previewImage: { width: "100%", height: "100%" },
});
