import { createEvent, fetchEvents, likeEvent, preSave, runMintJob, resumeStuckMints, expireStaleEvents, burnExpiredTickets, getEventById, getEventStats } from "../mod/events"
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
        const message = error instanceof Error ? error.message : "Failed to create event";
        console.error("createEvent error:", message);
        res.status(500).json({ error: message });
    }
}

export async function eventStatsRouter(req: AuthRequest, res: Response) {
    try {
        const eventId = req.query.eventId as string;
        const stats = await getEventStats(eventId, req.user!.id);
        res.status(200).json(stats);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch event stats";
        console.error("getEventStats error:", message);
        res.status(message === "Unauthorized" ? 403 : 500).json({ error: message });
    }
}

export async function likeEventRouter(req: AuthRequest, res: Response) {

    try {
        const userId = req.user!.id;
        const { eventId } = req.body;

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
        const { eventId } = req.body;

        const result = await preSave({ userId, eventId })

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to save event"})
    }
}

export async function mintTicketsRouter(req: AuthRequest, res: Response) {
    try {
        const { eventId } = req.body;
        const userId = req.user!.id;

        const { data: event, error: fetchError } = await supabase
            .from("events")
            .select("creator_id")
            .eq("id", eventId)
            .single();

        if (fetchError || !event) {
            return res.status(404).json({ error: "Event not found" });
        }
        if (event.creator_id !== userId) {
            return res.status(403).json({ error: "Not authorized to mint tickets for this event" });
        }

        runMintJob(eventId);
        res.status(202).json({ status: "queued" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to mint Tickets" });
    }
}

export async function resumeStuckMintsRouter(_req: AuthRequest, res: Response) {
    try {
        await resumeStuckMints();
        res.json({ status: "ok" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to resume stuck mints" });
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
        const eventId = req.params.id as string;
        const num = Number(req.params.num);
        const event = await getEventById(eventId);

        const { data: collectible } = await supabase
            .from("collectibles")
            .select("ticket_tiers(name, price, info)")
            .eq("event_id", eventId)
            .eq("serial_number", num)
            .single();

        const tier = collectible?.ticket_tiers as unknown as { name: string; price: number; info: string | null } | null;

        res.json({
            name: tier ? `${tier.name} Ticket #${num}` : `Ticket #${num}`,
            symbol: "TKT",
            description: event.description ?? "",
            image: event.flyer_card ?? "",
            attributes: [
                { trait_type: "Serial", value: num },
                { trait_type: "Venue", value: event.venue },
                { trait_type: "Date", value: event.event_date },
                ...(tier ? [{ trait_type: "Tier", value: tier.name }] : []),
                ...(tier?.info ? [{ trait_type: "Tier Info", value: tier.info }] : []),
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