import { api } from "./apiClient";

export type GifResult = {
    id: string;
    title: string;
    previewUrl: string;
    url: string;
    width?: number;
    height?: number;
};

async function search(type: "gifs" | "stickers", query: string, limit: number) {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    params.set("limit", String(limit));
    params.set("type", type);
    const { gifs } = await api.get<{ gifs: GifResult[] }>(
        `/api/giphy-search?${params.toString()}`,
        "Failed to search GIFs",
    );
    return gifs;
}

export async function searchGifs(query: string, limit = 24) {
    return search("gifs", query, limit);
}

export async function searchStickers(query: string, limit = 24) {
    return search("stickers", query, limit);
}
