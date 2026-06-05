import { createEvent, fetchEvents, likeEvent, preSave, mintTickets, expireStaleEvents, burnExpiredTickets, getEventById } from "../mod/events"
import { AuthRequest } from "../mod/auth"
import { Request, Response } from "express"
import { supabase } from "../services/supabase"


export async function fetchEventsRouter(req: AuthRequest, res: Response) {
    try {
        const limit = Number(req.query.limit) || 20
        const offset = Number(req.query.offset) || 0
        const result = await fetchEvents(limit, offset)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch events" })
    }
}

export async function createEventRouter(req: AuthRequest, res: Response) {
    try {
        const userid = req.user!.id;
        const eventData = req.body;

        const result = await createEvent(userid, eventData)

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create event" });
    }
}

export async function likeEventRouter(req: AuthRequest, res: Response) {

    try {
        const userId = req.user!.id;
        const eventId = req.body;

        const result = await likeEvent({ userId, eventId })

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to like event" });
    }
}

export async function preSaveRouter(req: AuthRequest, res: Response) {

    try {
        const userId = req.user!.id;
        const eventId = req.body;

        const result = await preSave({ userId, eventId })

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save event"})
    }
}

export async function mintTicketsRouter(req: AuthRequest, res: Response) {
    try {
        const { supply, eventId } = req.body;
        const result = await mintTickets({ supply, eventId });
        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to mint Tickets" });
    }
}

export async function burnExpiredTicketsRouter(_req: AuthRequest, res: Response) {
    try {
        const result = await burnExpiredTickets();
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to burn expired tickets" });
    }
}

export async function uploadFlyerRouter(req: AuthRequest, res: Response) {
    try {
        const { data: b64, contentType = "image/jpeg" } = req.body as { data: string; contentType?: string };
        if (!b64) return res.status(400).json({ error: "Missing image data" });
        const buffer = Buffer.from(b64, "base64");
        const path = `flyers/${req.user!.id}/${Date.now()}.jpg`;
        const { error } = await supabase.storage.from("event-flyers").upload(path, buffer, { contentType });
        if (error) throw error;
        const { data } = supabase.storage.from("event-flyers").getPublicUrl(path);
        res.json({ url: data.publicUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Upload failed" });
    }
}

export async function expireEventsRouter(req: AuthRequest, res: Response) {
    try {
        const result = await expireStaleEvents();
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to expire events" });
    }
}

export async function eventMetadataRouter(req: Request, res: Response) {
    try {
        const event = await getEventById(req.params.id as string);
        res.json({
            name: event.title,
            symbol: "TKT",
            description: event.description ?? "",
            image: event.flyer_card ?? "",
            attributes: [
                { trait_type: "Venue", value: event.venue },
                { trait_type: "Date", value: event.event_date },
            ],
        });
    } catch {
        res.status(404).json({ error: "Event not found" });
    }
}

export async function ticketMetadataRouter(req: Request, res: Response) {
    try {
        const event = await getEventById(req.params.id as string);
        const num = Number(req.params.num);
        res.json({
            name: `Ticket #${num}`,
            symbol: "TKT",
            description: event.description ?? "",
            image: event.flyer_card ?? "",
            attributes: [
                { trait_type: "Serial", value: num },
                { trait_type: "Venue", value: event.venue },
                { trait_type: "Date", value: event.event_date },
            ],
        });
    } catch {
        res.status(404).json({ error: "Event not found" });
    }
}




/*router.post("/events/:id/like", requireUser, async (req, res) => {
    const userId = req.user.id;
    const eventId = req.params.id;

    // Insert like
    const { error } = await supabase
        .from("event_likes")
        .insert({ user_id: userId, event_id: eventId });

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
});


router.post("/events/:id/preorder", requireUser, async (req, res) => {
    const userId = req.user.id;
    const eventId = req.params.id;

    const { error } = await supabase
        .from("preorders")
        .insert({ user_id: userId, event_id: eventId });

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
});
*/