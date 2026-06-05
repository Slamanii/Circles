import { createStory, viewStory, unlikeStory, likeStory, deleteSubStory, deleteStory, fetchStories,
         fetchStoriesPreview, fetchStoryByUser, fetchStoryViews, fetchStoryLikes, fetchDiscoverStories }
    from "../mod/stories"

export async function createStoryRouter(req: any, res: any) {

    try {     
     
    const userId = req.user.id;
    const storyData = req.body;

    const result = await createStory({ userId, ...storyData })
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to craete story"})
    }
}

export async function viewStoryRouter(req: any, res: any) {

    try {     
     
    const viewerId = req.user.id;
    const storyData = req.body;

    const result = await viewStory({ viewerId, ...storyData })
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to load story"})
    }
}

export async function unlikeStoryRouter(req: any, res: any) {

    try {     
     
    const userId = req.user.id;
    const storyData = req.body;

    const result = await unlikeStory({ userId, ...storyData })
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to unlike story"})
    }
}

export async function likeStoryRouter(req: any, res: any) {

    try {     
     
    const userId = req.user.id;
    const storyData = req.body;

    const result = await likeStory({ userId, ...storyData })
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to like story"})
    }
}

export async function deleteSubStoryRouter(req: any, res: any) {

    try {     
     
    const userId = req.user.id;
    const { deleteStoryData } = req.body;

    const result = await deleteSubStory(userId, deleteStoryData)
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to delete sub story"})
    }
}

export async function deleteStoryRouter(req: any, res: any) {

    try {     
     
    const userId = req.user.id;
    const { deleteStoryData } = req.body;

    const result = await deleteStory(userId, deleteStoryData)
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to delete story"})
    }
}

export async function fetchStoriesRouter(req: any, res: any) {

    try {     
    const userId = req.user.id;

    const result = await fetchStories(userId)
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to fetch stories"})
    }
}


export async function fetchStoriesPreviewRouter(req: any, res: any) {

    try {     
    const userId = req.user.id;
    
    const result = await fetchStoriesPreview(userId)
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to fetch stories preview"})
    }
}

export async function fetchStoryByUserRouter(req: any, res: any) {

    try {     

    const userId = req.user.id;

    const result = await fetchStoryByUser(userId)
    res.status(201).json(result)

    } catch (error) {
        console.error(error)
        res.status(500).json({error: "Failed to fetch story by user"})
    }
}

export async function fetchDiscoverStoriesRouter(req: any, res: any) {
    try {
        const userId = req.user.id;
        const result = await fetchDiscoverStories(userId, 400);
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch discover stories" });
    }
}

export async function fetchStoryViewsRouter(req: any, res: any) {
  try {

    const { subStoryId } = req.params;

    const result = await fetchStoryViews(subStoryId);

    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch story views" });
  }
}

export async function fetchStoryLikesRouter(req: any, res: any) {
  try {

    const { subStoryId } = req.params;

    const result = await fetchStoryLikes(subStoryId);

    res.status(200).json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch story likes" });
  }
}



