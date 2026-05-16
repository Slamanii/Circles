import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { Platform } from "react-native";

export type StoryMedia  = {
  file: File; // You may wrap uri as File if using web or RN
  type: "image" | "video";
  caption?: string;
  preview?: string; // optional thumbnail for videos
};

export function useStoryPicker() {
  const [loading, setLoading] = useState(false);

  // Pick media from gallery
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
            // Generate video thumbnail
            const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, {
              time: 1000,
            });
            preview = uri;
          }

          // Convert URI to a File object if needed (web)
          const file = new File([asset.uri], asset.uri.split("/").pop() || "file", {
            type: type === "image" ? "image/jpeg" : "video/mp4",
          });

          return { file, type, preview };
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

  // Take photo or video from camera
  const pickFromCamera = async (): Promise<StoryMedia[]> => {
    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (result.canceled) return [];

      const asset = result.assets[0];
      if (!asset?.uri) return [];

      const type = asset.type === "video" ? "video" : "image";

      let preview: string | undefined;
      if (type === "video") {
        const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, {
          time: 1000,
        });
        preview = uri;
      }

      const file = new File([asset.uri], asset.uri.split("/").pop() || "file", {
        type: type === "image" ? "image/jpeg" : "video/mp4",
      });

      return [{ file, type, preview }];
    } catch (err) {
      console.error("pickFromCamera error", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    pickFromGallery,
    pickFromCamera,
    loading,
  };
}