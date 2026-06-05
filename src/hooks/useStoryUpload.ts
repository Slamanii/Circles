import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";

export type StoryMedia = {
    uri: string;
    type: "image" | "video";
    caption?: string;
    preview?: string;
};

export function useStoryPicker() {
    const [loading, setLoading] = useState(false);

    const pickFromGallery = async (): Promise<StoryMedia[]> => {
        setLoading(true);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                allowsMultipleSelection: true,
                quality: 0.8,
            });

            if (result.canceled) return [];

            const files: (StoryMedia | null)[] = await Promise.all(
                result.assets.map(async (asset) => {
                    if (!asset.uri) return null;
                    const type = asset.type === "video" ? "video" : "image";
                    let preview: string | undefined;
                    if (type === "video") {
                        const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 1000 });
                        preview = uri;
                    }
                    return { uri: asset.uri, type, preview };
                })
            );

            return files.filter((f): f is StoryMedia => f !== null);
        } catch (err) {
            console.error("pickFromGallery error", err);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const pickFromCamera = async (): Promise<StoryMedia[]> => {
        setLoading(true);
        try {
            const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
            if (result.canceled) return [];
            const asset = result.assets[0];
            if (!asset?.uri) return [];
            const type = asset.type === "video" ? "video" : "image";
            let preview: string | undefined;
            if (type === "video") {
                const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 1000 });
                preview = uri;
            }
            return [{ uri: asset.uri, type, preview }];
        } catch (err) {
            console.error("pickFromCamera error", err);
            return [];
        } finally {
            setLoading(false);
        }
    };

    return { pickFromGallery, pickFromCamera, loading };
}
