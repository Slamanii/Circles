import { supabase } from "../services/supabase";
import { notifyUser } from "../services/realtime";

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

    const { error: itemsError } = await supabase.from("story_items").insert(items);
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
        .from('story_views')
        .insert({
            story_item_id: storyItemId,
            viewer_id: viewerId,
        });

    if (error && error.code !== "23505") {
        throw error;
    }

    return true;
}

// Likes are scoped to the parent story, not any one sub-story segment, so a
// post that spans several segments carries one consistent like count.
export async function likeStory({
    storyId,
    userId,
}: {
    storyId: string;
    userId: string;
}) {

    const { error } = await supabase
        .from("story_likes")
        .insert({
            story_id: storyId,
            user_id: userId,
        });

    if (error && error.code !== "23505") {
        throw error;
    }

    const { data: story } = await supabase
        .from("stories")
        .select("id, user_id")
        .eq("id", storyId)
        .single();
    if (story && story.user_id !== userId) {
        await notifyUser(story.user_id, {
            type: "story_liked",
            body: "Someone liked your story",
            reference_id: storyId,
            reference_type: "story",
            metadata: { storyId },
        });
    }

    return true;
}

export async function unlikeStory({
    storyId,
    userId,
}: {
    storyId: string;
    userId: string;
}) {

    const { error } = await supabase
        .from("story_likes")
        .delete()
        .eq("story_id", storyId)
        .eq("user_id", userId);

    if (error) throw error;

    return true;
}


export async function deleteSubStory(subStoryId: string, userId: string) {

    const { data: substory } = await supabase
        .from("story_items")
        .select("id, stories!inner(user_id)")
        .eq("id", subStoryId)
        .single();

    if (!substory || substory.stories[0].user_id !== userId) {
        throw new Error("Unauthorized");
    }

    await supabase
        .from("story_views")
        .delete()
        .eq("story_item_id", subStoryId);

    const { error } = await supabase
        .from("story_items")
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
        .from("story_items")
        .select("id")
        .eq("story_id", storyId);

    const subIds = subs?.map(s => s.id) ?? [];

    await supabase.from("story_likes").delete().eq("story_id", storyId);
    await supabase.from("story_comments").delete().eq("story_id", storyId);
    await supabase.from("story_views").delete().in("story_item_id", subIds);

    await supabase.from("story_items").delete().eq("story_id", storyId);


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
      story_items (
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


export async function fetchStoriesPreview(userId: string, limit: number = 400) {

  const { data, error } = await supabase
    .from("stories")
    .select(`
      id,
      user_id,
      users (username, avatar),
      story_items (
        id,
        media_url,
        created_at
      )
    `)
    .neq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  // One preview per user (their most recent story), across followed and discover alike
  const seenUsers = new Set<string>();
  const preview: typeof data = [];
  for (const story of data ?? []) {
    if (seenUsers.has(story.user_id)) continue;
    seenUsers.add(story.user_id);
    preview.push(story);
  }

  return preview;
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
  console.log("[fetchStoryByUser] userId:", userId);

  const { data: stories, error: storiesError } = await supabase
    .from("stories")
    .select("id, user_id, created_at, preview_media_snapshot")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (storiesError) throw storiesError;
  if (!stories?.length) return [];

  const storyIds = stories.map(s => s.id);

  const { data: items, error: itemsError } = await supabase
    .from("story_items")
    .select("id, story_id, media_url, caption, media_type, created_at")
    .in("story_id", storyIds)
    .order("created_at", { ascending: true });

  if (itemsError) throw itemsError;

  return stories.map(s => ({
    ...s,
    story_items: items?.filter(i => i.story_id === s.id) ?? [],
  }));
}

export async function fetchStoryById(storyId: string) {
  const { data, error } = await supabase
    .from("stories")
    .select(`
      id,
      user_id,
      created_at,
      preview_media_snapshot,
      users (username, avatar),
      story_items (
        id,
        media_url,
        caption,
        media_type,
        created_at
      )
    `)
    .eq("id", storyId)
    .single();

  if (error) throw error;

  return data;
}

export async function fetchStoryViews(subStoryId: string) {

  const { data, error } = await supabase
    .from("story_views")
    .select(`
      viewer_id,
      users (username, avatar)
    `)
    .eq("story_item_id", subStoryId);

  if (error) throw error;

  return data;
}


export async function fetchStoryLikes(storyId: string) {

  const { data, error } = await supabase
    .from("story_likes")
    .select(`
      user_id,
      users (username, avatar)
    `)
    .eq("story_id", storyId);

  if (error) throw error;

  return data;
}

// One level of replies (not infinite nesting) — a reply's parent_comment_id
// always points at a top-level comment, mirrored in how the client groups them.
// Comments are scoped to the parent story (not a sub-story segment), same as likes.
export async function addComment({
    storyId,
    userId,
    content,
    parentCommentId,
}: {
    storyId: string;
    userId: string;
    content: string;
    parentCommentId?: string;
}) {
    const trimmed = content?.trim();
    if (!trimmed) throw new Error("Comment cannot be empty");

    const { data: comment, error } = await supabase
        .from("story_comments")
        .insert({
            story_id: storyId,
            user_id: userId,
            content: trimmed,
            parent_comment_id: parentCommentId ?? null,
        })
        .select("id, story_id, parent_comment_id, content, created_at, user_id, users(username, avatar)")
        .single();

    if (error) throw error;

    const { data: story } = await supabase
        .from("stories")
        .select("id, user_id")
        .eq("id", storyId)
        .single();

    if (parentCommentId) {
        const { data: parentComment } = await supabase
            .from("story_comments")
            .select("user_id")
            .eq("id", parentCommentId)
            .single();
        if (parentComment && parentComment.user_id !== userId) {
            await notifyUser(parentComment.user_id, {
                type: "story_comment_reply",
                body: "Someone replied to your comment",
                reference_id: storyId,
                reference_type: "story",
                metadata: { storyId, commentId: comment.id },
            });
        }
    } else if (story && story.user_id !== userId) {
        await notifyUser(story.user_id, {
            type: "story_commented",
            body: "Someone commented on your story",
            reference_id: storyId,
            reference_type: "story",
            metadata: { storyId, commentId: comment.id },
        });
    }

    return comment;
}

export async function deleteComment(commentId: string, userId: string) {
    const { data: comment } = await supabase
        .from("story_comments")
        .select("user_id")
        .eq("id", commentId)
        .single();

    if (!comment || comment.user_id !== userId) throw new Error("Unauthorized");

    const { error } = await supabase.from("story_comments").delete().eq("id", commentId);
    if (error) throw error;
    return true;
}

export async function fetchComments(storyId: string, viewerId?: string) {
    const { data: comments, error } = await supabase
        .from("story_comments")
        .select("id, parent_comment_id, content, created_at, user_id, users(username, avatar)")
        .eq("story_id", storyId)
        .order("created_at", { ascending: true });

    if (error) throw error;
    if (!comments?.length) return [];

    const commentIds = comments.map(c => c.id);
    const { data: likes } = await supabase
        .from("story_comment_likes")
        .select("comment_id, user_id")
        .in("comment_id", commentIds);

    const likeCountByComment = new Map<string, number>();
    const likedByViewer = new Set<string>();
    for (const like of likes ?? []) {
        likeCountByComment.set(like.comment_id, (likeCountByComment.get(like.comment_id) ?? 0) + 1);
        if (viewerId && like.user_id === viewerId) likedByViewer.add(like.comment_id);
    }

    return comments.map(c => ({
        ...c,
        likeCount: likeCountByComment.get(c.id) ?? 0,
        likedByViewer: likedByViewer.has(c.id),
    }));
}

export async function likeComment({ commentId, userId }: { commentId: string; userId: string }) {
    const { error } = await supabase
        .from("story_comment_likes")
        .insert({ comment_id: commentId, user_id: userId });

    if (error && error.code !== "23505") throw error;

    const { data: comment } = await supabase
        .from("story_comments")
        .select("user_id, story_id")
        .eq("id", commentId)
        .single();
    if (comment && comment.user_id !== userId) {
        await notifyUser(comment.user_id, {
            type: "story_comment_liked",
            body: "Someone liked your comment",
            reference_id: commentId,
            reference_type: "story_comment",
            metadata: { commentId, storyId: comment.story_id },
        });
    }

    return true;
}

export async function unlikeComment({ commentId, userId }: { commentId: string; userId: string }) {
    const { error } = await supabase
        .from("story_comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", userId);

    if (error) throw error;
    return true;
}