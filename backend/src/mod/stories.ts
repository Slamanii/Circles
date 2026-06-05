import { supabase } from "../services/supabase";

export async function createStory({
    userId,
    mediaFiles,
}: {
    userId: string;
    mediaFiles: {
        mediaUrl: string;
        caption?: string;
        type: "image" | "video";
    }[];
}) {
    const { data: story, error: storyError } = await supabase
        .from("stories")
        .insert({
            user_id: userId,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
        .select()
        .single();

    if (storyError) throw storyError;

    const items = mediaFiles.map((file, i) => ({
        story_id: story.id,
        media_url: file.mediaUrl,
        caption: file.caption ?? null,
        media_type: file.type,
        position: i + 1,
    }));

    const { error: itemsError } = await supabase.from("storyitems").insert(items);
    if (itemsError) throw itemsError;

    await supabase
        .from("stories")
        .update({ preview_media_snapshot: items[items.length - 1].media_url })
        .eq("id", story.id);

    return story;
}

export async function viewStory({
    storyItemId,
    viewerId,
}: {
    storyItemId: string;
    viewerId: string;
}) {

    const { error } = await supabase
        .from('storyViews')
        .insert({
            story_item_id: storyItemId,
            viewer_id: viewerId,
        });

    if (error && error.code !== "23505") {
        throw error;
    }

    return true;
}

export async function likeStory({
    storyItemId,
    userId,
}: {
    storyItemId: string;
    userId: string;
}) {

    const { error } = await supabase
        .from("storyLikes")
        .insert({
            story_item_id: storyItemId,
            user_id: userId,
        });

    if (error && error.code !== "23505") {
        throw error;
    }

    return true;
}

export async function unlikeStory({
    storyItemId,
    userId,
}: {
    storyItemId: string;
    userId: string;
}) {

    const { error } = await supabase
        .from("storyLikes")
        .delete()
        .eq("story_item_id", storyItemId)
        .eq("user_id", userId);

    if (error) throw error;

    return true;
}


export async function deleteSubStory(subStoryId: string, userId: string) {

    const { data: substory } = await supabase
        .from("storyItems")
        .select("id, stories!inner(user_id)")
        .eq("id", subStoryId)
        .single();

    if (!substory || substory.stories[0].user_id !== userId) {
        throw new Error("Unauthorized");
    }

    await supabase
        .from("storyViews")
        .delete()
        .eq("story_item_id", subStoryId);

    const { error } = await supabase
        .from("storyItems")
        .delete()
        .eq("id", subStoryId);

    if (error) throw error;
}

export async function deleteStory(storyId: string, userId: string) {

    const { data: story } = await supabase
        .from("stories")
        .select("id")
        .eq("id", storyId)
        .eq("user_id", userId)
        .single();

    if (!story) {
        throw new Error("Unauthorized");
    }

    const { data: subs } = await supabase
        .from("storyItems")
        .select("id")
        .eq("story_id", storyId);

    const subIds = subs?.map(s => s.id) ?? [];

    await supabase.from("storylikes").delete().in("story_item_id", subIds);
    await supabase.from("storyViews").delete().in("story_item_id", subIds);

    await supabase.from("storyItems").delete().eq("story_id", storyId);


    await supabase.from("stories").delete().eq("id", storyId);

}

export async function fetchStories(userId: string) {
  const { data: follows, error: followsError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  if (followsError) throw followsError;

  const followingIds = follows?.map((f) => f.following_id) ?? [];

  if (followingIds.length === 0) return [];

  const { data, error } = await supabase
    .from("stories")
    .select(`
      id,
      user_id,
      created_at,
      users (username, avatar),
      storyItems (
        id,
        media_url,
        caption,
        created_at
      )
    `)
    .in("user_id", followingIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}


export async function fetchStoriesPreview(userId: string) {

    const { data: follows, error: followsError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  if (followsError) throw followsError;

  const followingIds = follows?.map((f) => f.following_id) ?? [];

  if (followingIds.length === 0) return [];

  const { data, error } = await supabase
    .from("stories")
    .select(`
      id,
      user_id,
      users (username, avatar),
      storyItems (
        id,
        media_url,
        created_at
      )
    `)
    .in("user_id", followingIds)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  return data;
}

export async function fetchDiscoverStories(currentUserId: string, limit: number = 400) {
    const { data, error } = await supabase
        .from("stories")
        .select(`
            id,
            user_id,
            preview_media_snapshot,
            users (username, avatar),
            story_items (
                id,
                media_url,
                created_at
            )
        `)
        .neq("user_id", currentUserId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}

export async function fetchStoryByUser(userId: string) {

  const { data, error } = await supabase
    .from("sub_stories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data;
}

export async function fetchStoryViews(subStoryId: string) {

  const { data, error } = await supabase
    .from("story_views")
    .select(`
      viewer_id,
      profiles (username, avatar_url)
    `)
    .eq("substory_id", subStoryId);

  if (error) throw error;

  return data;
}


export async function fetchStoryLikes(subStoryId: string) {

  const { data, error } = await supabase
    .from("story_likes")
    .select(`
      user_id,
      profiles (username, avatar_url)
    `)
    .eq("substory_id", subStoryId);

  if (error) throw error;

  return data;
}