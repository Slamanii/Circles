import { createEvent, fetchEvents, likeEvent, preSave, mintTickets, expireStaleEvents } from "../mod/events"
import { AuthRequest } from "../mod/auth"
import { Response } from "express" 


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
        const { supply, creatorId, eventId } = req.body;
        const result = await mintTickets({ supply, creatorId, eventId });
        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to mint Tickets" });
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