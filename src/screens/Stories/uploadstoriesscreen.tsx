import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Video, ResizeMode } from "expo-av";
import { useState } from "react";
import {
    ActivityIndicator, KeyboardAvoidingView, Platform,
    ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Colors } from "../../shared/theme";
import { useStoryPicker, StoryMedia } from "../../hooks/useStoryUpload";
import { createStory } from "../../services/story";
import { uploadMedia } from "../../services/upload";

export default function StoryUploadScreen() {
    const navigation = useNavigation<any>();
    const { pickFromCamera, pickFromGallery, loading } = useStoryPicker();
    const [selectedFiles, setSelectedFiles] = useState<StoryMedia[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [uploading, setUploading] = useState(false);

    const active = selectedFiles[activeIndex];

    const handlePickGallery = async () => {
        const files = await pickFromGallery();
        if (!files.length) return;
        setSelectedFiles(prev => {
            setActiveIndex(prev.length);
            return [...prev, ...files];
        });
    };

    const handlePickCamera = async () => {
        const files = await pickFromCamera();
        if (!files.length) return;
        setSelectedFiles(prev => {
            setActiveIndex(prev.length);
            return [...prev, ...files];
        });
    };

    const handleSetCaption = (text: string) => {
        setSelectedFiles(prev => prev.map((f, i) => i === activeIndex ? { ...f, caption: text } : f));
    };

    const handleRemove = (index: number) => {
        setSelectedFiles(prev => {
            const next = prev.filter((_, i) => i !== index);
            setActiveIndex(cur => Math.min(cur, Math.max(next.length - 1, 0)));
            return next;
        });
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

    // ─── Empty state — choose a source ─────────────────────────────────────────
    if (selectedFiles.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn} hitSlop={12}>
                    <Ionicons name="close" size={26} color="#fff" />
                </TouchableOpacity>

                <View style={styles.emptyBody}>
                    <Text style={styles.emptyTitle}>Add to Your Story</Text>
                    <Text style={styles.emptySub}>Share a photo or video that disappears in 24 hours</Text>

                    <View style={styles.sourceRow}>
                        <TouchableOpacity
                            style={styles.sourceCard}
                            onPress={handlePickCamera}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            <View style={styles.sourceIconWrap}>
                                {loading
                                    ? <ActivityIndicator color={Colors.black} />
                                    : <Ionicons name="camera" size={30} color={Colors.black} />
                                }
                            </View>
                            <Text style={styles.sourceLabel}>Camera</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.sourceCard}
                            onPress={handlePickGallery}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            <View style={styles.sourceIconWrap}>
                                {loading
                                    ? <ActivityIndicator color={Colors.black} />
                                    : <Ionicons name="images" size={28} color={Colors.black} />
                                }
                            </View>
                            <Text style={styles.sourceLabel}>Gallery</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    // ─── Preview state — active item + caption + thumbnail strip ──────────────
    return (
        <View style={styles.previewContainer}>
            <View style={styles.mediaArea}>
                {active?.type === "video" ? (
                    <Video
                        source={{ uri: active.uri }}
                        style={styles.media}
                        resizeMode={ResizeMode.COVER}
                        isLooping
                        shouldPlay
                        isMuted
                    />
                ) : (
                    <Image source={{ uri: active?.uri }} style={styles.media} contentFit="cover" />
                )}

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.previewCloseBtn} hitSlop={12}>
                    <Ionicons name="close" size={26} color="#fff" />
                </TouchableOpacity>

                <Text style={styles.countBadge}>{activeIndex + 1} / {selectedFiles.length}</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                {/* Thumbnail strip */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.thumbStrip}
                    keyboardShouldPersistTaps="handled"
                >
                    {selectedFiles.map((f, i) => (
                        <TouchableOpacity key={i} onPress={() => setActiveIndex(i)} activeOpacity={0.85}>
                            <View style={[styles.thumb, i === activeIndex && styles.thumbActive]}>
                                <Image source={{ uri: f.preview ?? f.uri }} style={styles.thumbImage} contentFit="cover" />
                                {f.type === "video" && (
                                    <Ionicons name="play" size={14} color="#fff" style={styles.thumbPlayIcon} />
                                )}
                                <TouchableOpacity
                                    onPress={() => handleRemove(i)}
                                    style={styles.thumbRemove}
                                    hitSlop={8}
                                >
                                    <Ionicons name="close" size={12} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={styles.thumbAdd}
                        onPress={handlePickGallery}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Ionicons name="add" size={22} color="#fff" />
                        }
                    </TouchableOpacity>
                </ScrollView>

                {/* Caption + share */}
                <View style={styles.bottomRow}>
                    <View style={styles.captionWrap}>
                        <TextInput
                            style={styles.captionInput}
                            placeholder="Add a caption..."
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            value={active?.caption ?? ""}
                            onChangeText={handleSetCaption}
                            multiline
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.shareBtn, uploading && styles.shareBtnDisabled]}
                        onPress={handleUpload}
                        disabled={uploading}
                        activeOpacity={0.85}
                    >
                        {uploading
                            ? <ActivityIndicator color={Colors.black} />
                            : <Ionicons name="arrow-forward" size={22} color={Colors.black} />
                        }
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    // Empty state
    emptyContainer: { flex: 1, backgroundColor: "#0D0D0D" },
    closeBtn: {
        marginTop: 56, marginLeft: 20,
        width: 40, height: 40, borderRadius: 20,
        alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    emptyBody: { flex: 1, justifyContent: "center", paddingHorizontal: 28, gap: 8 },
    emptyTitle: { color: "#fff", fontSize: 24, fontWeight: "800", textAlign: "center" },
    emptySub: { color: "rgba(255,255,255,0.55)", fontSize: 14, textAlign: "center", marginBottom: 36 },
    sourceRow: { flexDirection: "row", justifyContent: "center", gap: 20 },
    sourceCard: {
        alignItems: "center", gap: 10,
        width: 120, paddingVertical: 22,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    },
    sourceIconWrap: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: Colors.accent,
        alignItems: "center", justifyContent: "center",
    },
    sourceLabel: { color: "#fff", fontSize: 14, fontWeight: "600" },

    // Preview state
    previewContainer: { flex: 1, backgroundColor: "#000" },
    mediaArea: { flex: 1 },
    media: { flex: 1 },
    previewCloseBtn: {
        position: "absolute", top: 56, left: 20,
        width: 40, height: 40, borderRadius: 20,
        alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    countBadge: {
        position: "absolute", top: 66, alignSelf: "center",
        color: "#fff", fontSize: 13, fontWeight: "600",
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 12, backgroundColor: "rgba(0,0,0,0.4)",
    },
    thumbStrip: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
    thumb: {
        width: 52, height: 52, borderRadius: 12, overflow: "hidden",
        borderWidth: 2, borderColor: "transparent", marginRight: 10,
    },
    thumbActive: { borderColor: Colors.accentText },
    thumbImage: { width: "100%", height: "100%" },
    thumbPlayIcon: { position: "absolute", top: "50%", left: "50%", marginLeft: -7, marginTop: -7 },
    thumbRemove: {
        position: "absolute", top: 2, right: 2,
        width: 16, height: 16, borderRadius: 8,
        backgroundColor: "rgba(0,0,0,0.6)",
        alignItems: "center", justifyContent: "center",
    },
    thumbAdd: {
        width: 52, height: 52, borderRadius: 12,
        alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.08)",
        borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
        borderStyle: "dashed",
    },
    bottomRow: {
        flexDirection: "row", alignItems: "center", gap: 10,
        paddingHorizontal: 16, paddingBottom: 28, paddingTop: 4,
    },
    captionWrap: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 90,
    },
    captionInput: { color: "#fff", fontSize: 14 },
    shareBtn: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: Colors.accent,
        alignItems: "center", justifyContent: "center",
    },
    shareBtnDisabled: { opacity: 0.6 },
});
