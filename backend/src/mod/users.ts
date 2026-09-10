import { supabase } from "../services/supabase"

export async function getUser(userId: string) {

    const { data, error } = await supabase
        .from("users")
        .select(`
            id,
            email,
            username,
            display_name,
            bio,
            link_1,
            link_2,
            location,
            avatar,
            wallet_id,
            address,
            verified,
            private,
            followers,
            following,
            likes,
            created_at
        `)
        .eq("id", userId)
        .single()

    if (error) throw error

    return data
}

export async function getUserProfile(targetId: string, viewerId: string) {
    const { data: user, error } = await supabase
        .from("users")
        .select("id, username, display_name, bio, link_1, link_2, location, avatar, verified, private, followers, following")
        .eq("id", targetId)
        .single();

    if (error) throw error;

    // For a private account, content is visible only to people the account owner follows.
    // Check: does targetId follow viewerId?
    const { count } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", targetId)
        .eq("following_id", viewerId);

    const canViewContent = !user.private || viewerId === targetId || (count ?? 0) > 0;

    return { ...user, canViewContent };
}

export async function updateProfile(userId: string, data: {
    display_name?: string;
    bio?: string;
    link_1?: string;
    link_2?: string;
    location?: string;
    avatar?: string;
    private?: boolean;
}) {
    const { data: user, error } = await supabase
        .from("users")
        .update(data)
        .eq("id", userId)
        .select()
        .single();

    if (error) throw error;
    return user;
}

export async function searchUsers(query: string) {

    const { data, error } = await supabase
        .from("users")
        .select("id, username, display_name, avatar, verified")
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20)

    if (error) throw error
    return data
}

async function markFollowedByViewer(rows: any[], idKey: "follower_id" | "following_id", viewerId: string) {
    const ids = rows.map((r) => r[idKey]).filter(Boolean);
    if (ids.length === 0) return rows;

    const { data: viewerFollows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", viewerId)
        .in("following_id", ids);

    const followedSet = new Set((viewerFollows ?? []).map((f) => f.following_id));
    return rows.map((r) => ({ ...r, isFollowing: followedSet.has(r[idKey]) }));
}

const FOLLOW_LIST_PAGE_SIZE = 30;

export async function fetchFollowers(userId: string, viewerId: string, limit: number = FOLLOW_LIST_PAGE_SIZE, offset: number = 0) {

    const { data, error } = await supabase
        .from("follows")
        .select(`
            follower_id,
            users!follows_follower_id_fkey (
                id,
                username,
                avatar
            )
            `)
        .eq("following_id", userId)
        .range(offset, offset + limit - 1)

        if (error) throw new Error("Couldn't load followers, try again.");

        return markFollowedByViewer(data ?? [], "follower_id", viewerId)
}

export async function fetchFollowing(userId: string, viewerId: string, limit: number = FOLLOW_LIST_PAGE_SIZE, offset: number = 0) {

    const { data, error } = await supabase
        .from("follows")
        .select(`
            following_id,
            users!follows_following_id_fkey (
                id,
                username,
                avatar
            )
            `)
        .eq("follower_id", userId)
        .range(offset, offset + limit - 1)

        if (error) throw new Error("Couldn't load following, try again.");

        return markFollowedByViewer(data ?? [], "following_id", viewerId)
}

export async function followUser(
    userId: string,
    followingId: string,
) {

    const { data, error } = await supabase
        .from("follows")
        .insert({
            follower_id: userId,
            following_id: followingId
        })

    if (error) throw error

    return data
}

export async function unfollowUser(
    userId: string,
    followingId: string,
) {

    const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", userId)
        .eq("following_id", followingId)

    if (error) throw error

    return { success: true }
}

export async function fetchEventLikes(eventId: string, userId: string) {

    const { data, count, error } = await supabase
        .from("event_likes")
        .select("*", { count: "exact" })
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .limit(5)
        
        if (error) throw error

        const likedByUser = (data ?? []).length > 0

        return {
            likedByUser,
            count: count ?? 0,
        }
}

export async function fetchHostedEvents(userId: string) {

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("creator_id", userId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) throw error

  return data ?? []
}

export async function fetchLikedEvents(userId: string) {

  const { data, error } = await supabase
    .from("event_likes")
    .select(`
      event_id,
      events (
        id,
        title,
        flyer_card,
        venue,
        event_date
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) throw error

  return (data ?? []).map((item: any) => item.events).filter(Boolean)
}