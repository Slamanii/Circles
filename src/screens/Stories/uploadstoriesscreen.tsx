import { useState } from "react";
import { Button, FlatList, Image, Text, View, StyleSheet } from "react-native";
import { useStoryPicker, StoryMedia } from "../../hooks/useStoryUpload";
import { createStory } from "../../services/story";

export default function StoryUploadScreen() {
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
            await createStory({
                mediaFiles: selectedFiles.map(f => ({
                    uri: f.preview || f.file.name,
                    type: f.type,
                    caption: f.caption ?? "",
                })),
            });
            setSelectedFiles([]);
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Button title="Pick from Gallery" onPress={handlePickGallery} disabled={loading} />
            <Button title="Open Camera" onPress={handlePickCamera} disabled={loading} />
            <FlatList
                data={selectedFiles}
                keyExtractor={(_, i) => String(i)}
                horizontal
                renderItem={({ item }) => (
                    <View style={styles.preview}>
                        {item.type === "image" ? (
                            <Image source={{ uri: item.preview || item.file.name }} style={styles.previewImage} />
                        ) : (
                            <Text style={styles.videoLabel}>Video</Text>
                        )}
                    </View>
                )}
            />
            <Button
                title={uploading ? "Uploading..." : "Upload Story"}
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
    videoLabel: { textAlign: "center", marginTop: 40 },
});
