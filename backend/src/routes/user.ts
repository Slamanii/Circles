import { getUser, getUserProfile, searchUsers, fetchFollowers, fetchFollowing, followUser, fetchEventLikes, fetchHostedEvents, fetchLikedEvents, updateProfile } from "../mod/users"
import { Response } from 'express'
import { AuthRequest } from "../mod/auth"


export async function searchUsersRouter(req: AuthRequest, res: Response) {
    try {
        const query = String(req.query.q || "").trim()
        if (!query) return res.status(400).json({ error: "Missing search query" })
        const results = await searchUsers(query)
        res.json(results)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Search failed" })
    }
}

export async function getUserRouter(req: AuthRequest, res: Response) {
    try {
        const user = await getUser(req.user!.id)
        res.json(user)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch user" })
    }
}

export async function updateProfileRouter(req: AuthRequest, res: Response) {
    try {
        const { display_name, bio, link_1, link_2, location, avatar } = req.body;
        const result = await updateProfile(req.user!.id, { display_name, bio, link_1, link_2, location, avatar });
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update profile" });
    }
}

export async function fetchFollowersRouter(req: AuthRequest, res: Response) {

    const followers = await fetchFollowers(req.user!.id)

    res.json(followers)
}

export async function fetchFollowingRouter(req: AuthRequest, res: Response) {

    const followers = await fetchFollowing(req.user!.id)

    res.json(followers)
}

export async function followUserRouter(req: AuthRequest, res: Response) {

    const userId = req.user!.id;
    const followingData = req.body;

    const follow = await followUser(userId, followingData)

    res.json(follow)
}

export async function fetchEventLikesRouter(req: AuthRequest, res: Response) {

    const userId = req.user!.id;
    const eventId = req.body;

    const likes = await fetchEventLikes(userId, eventId)

    res.json(likes)
}


export async function fetchHostedEventsRouter(req: AuthRequest, res: Response) {
    const targetId = req.body?.userId || req.user!.id
    const events = await fetchHostedEvents(targetId)
    res.json(events)
}

export async function fetchLikedEventsRouter(req: AuthRequest, res: Response) {
    try {
        const events = await fetchLikedEvents(req.user!.id)
        res.json(events)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch liked events" })
    }
}

export async function getUserProfileRouter(req: AuthRequest, res: Response) {
    try {
        const viewerId = req.user!.id;
        const targetId = (req.query.id as string) || viewerId;
        // Own profile — no privacy check needed
        const user = targetId === viewerId
            ? await getUser(targetId)
            : await getUserProfile(targetId, viewerId);
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
}