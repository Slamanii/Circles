import { createStory, viewStory, unlikeStory, likeStory, deleteSubStory, deleteStory, fetchStories,
         fetchStoriesPreview, fetchStoryByUser, fetchStoryById, fetchStoryViews, fetchStoryLikes, fetchDiscoverStories }
    from "../mod/stories"
import { AuthRequest } from "../mod/auth"
import { Response } from "express"

export async function createStoryRouter(req: AuthRequest, res: Response) {

    try {     
     
    const userId = req.user!.id;
    const storyData = req.body;

    const result = await createStory({ userId, ...storyData })
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to craete story"})
    }
}

export async function viewStoryRouter(req: AuthRequest, res: Response) {

    try {     
     
    const viewerId = req.user!.id;
    const storyData = req.body;

    const result = await viewStory({ viewerId, ...storyData })
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to load story"})
    }
}

export async function unlikeStoryRouter(req: AuthRequest, res: Response) {

    try {     
     
    const userId = req.user!.id;
    const storyData = req.body;

    const result = await unlikeStory({ userId, ...storyData })
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to unlike story"})
    }
}

export async function likeStoryRouter(req: AuthRequest, res: Response) {

    try {     
     
    const userId = req.user!.id;
    const storyData = req.body;

    const result = await likeStory({ userId, ...storyData })
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to like story"})
    }
}

export async function deleteSubStoryRouter(req: AuthRequest, res: Response) {

    try {     
     
    const userId = req.user!.id;
    const { deleteStoryData } = req.body;

    const result = await deleteSubStory(deleteStoryData, userId)
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to delete sub story"})
    }
}

export async function deleteStoryRouter(req: AuthRequest, res: Response) {

    try {     
     
    const userId = req.user!.id;
    const { deleteStoryData } = req.body;

    const result = await deleteStory(deleteStoryData, userId)
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to delete story"})
    }
}

export async function fetchStoriesRouter(req: AuthRequest, res: Response) {

    try {     
    const userId = req.user!.id;

    const result = await fetchStories(userId)
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to fetch stories"})
    }
}


export async function fetchStoriesPreviewRouter(req: AuthRequest, res: Response) {

    try {     
    const userId = req.user!.id;
    
    const result = await fetchStoriesPreview(userId)
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to fetch stories preview"})
    }
}

export async function fetchStoryByUserRouter(req: AuthRequest, res: Response) {

    try {

    const userId = (req.query.userId as string) || req.user!.id;

    const result = await fetchStoryByUser(userId)
    res.status(200).json(result)

    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch story by user";
        console.error("fetchStoryByUser error:", message);
        res.status(500).json({ error: message });
    }
}

export async function fetchStoryByIdRouter(req: AuthRequest, res: Response) {
    try {
        const { storyId } = req.query;
        const result = await fetchStoryById(storyId as string);
        res.status(200).json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch story";
        console.error("fetchStoryById error:", message);
        res.status(500).json({ error: message });
    }
}

export async function fetchDiscoverStoriesRouter(req: AuthRequest, res: Response) {
    try {
        const userId = req.user!.id;
        const result = await fetchDiscoverStories(userId, 400);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch discover stories" });
    }
}

export async function fetchStoryViewsRouter(req: AuthRequest, res: Response) {
  try {

    const { subStoryId } = req.query;

    const result = await fetchStoryViews(subStoryId as string);

    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch story views" });
  }
}

export async function fetchStoryLikesRouter(req: AuthRequest, res: Response) {
  try {

    const { subStoryId } = req.body;

    const result = await fetchStoryLikes(subStoryId);

    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch story likes" });
  }
}



