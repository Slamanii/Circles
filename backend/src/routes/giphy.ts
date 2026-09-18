import axios from "axios";
import { Response } from "express";
import { AuthRequest } from "../mod/auth";

const GIPHY_BASE_URLS = {
    gifs: "https://api.giphy.com/v1/gifs",
    stickers: "https://api.giphy.com/v1/stickers",
};

export async function giphySearchRouter(req: AuthRequest, res: Response) {
    try {
        const apiKey = process.env.GIPHY_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "GIPHY not configured" });

        const { q, limit, type } = req.query as { q?: string; limit?: string; type?: string };
        const cappedLimit = Math.min(parseInt(limit ?? "24", 10) || 24, 50);
        const base = type === "stickers" ? GIPHY_BASE_URLS.stickers : GIPHY_BASE_URLS.gifs;

        const endpoint = q?.trim() ? "search" : "trending";
        const { data } = await axios.get(`${base}/${endpoint}`, {
            params: {
                api_key: apiKey,
                q: q?.trim() || undefined,
                limit: cappedLimit,
                rating: "pg-13",
            },
        });

        const gifs = (data.data ?? []).map((g: any) => ({
            id: g.id,
            title: g.title,
            previewUrl: g.images?.fixed_width_small?.url ?? g.images?.fixed_width?.url,
            url: g.images?.fixed_width?.url ?? g.images?.original?.url,
            width: Number(g.images?.fixed_width?.width) || undefined,
            height: Number(g.images?.fixed_width?.height) || undefined,
        }));

        res.json({ gifs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to search GIFs" });
    }
}
