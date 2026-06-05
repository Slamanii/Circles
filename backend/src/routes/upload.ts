import { Response } from "express";
import { AuthRequest } from "../mod/auth";
import { supabase } from "../services/supabase";

const ALLOWED_BUCKETS = ["stories", "avatars", "event-flyers", "chat"] as const;
type Bucket = (typeof ALLOWED_BUCKETS)[number];

export async function getUploadUrlRouter(req: AuthRequest, res: Response) {
    try {
        const { bucket, filename, contentType } = req.body as {
            bucket: Bucket;
            filename: string;
            contentType: string;
        };

        if (!ALLOWED_BUCKETS.includes(bucket)) {
            return res.status(400).json({ error: "Invalid bucket" });
        }

        const path = `${req.user!.id}/${Date.now()}-${filename}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUploadUrl(path);

        if (error) throw error;

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

        res.json({ signedUrl: data.signedUrl, path, publicUrl: urlData.publicUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create upload URL" });
    }
}
