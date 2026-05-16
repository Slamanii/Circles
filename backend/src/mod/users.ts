import { supabase } from "../services/supabase"

export async function getUser(userId: string) {

    const { data, error } = await supabase
        .from("users")
        .select(`
            id,
            email,
            username,
            display_name,
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

export async function searchUsers(query: string) {

    const { data, error } = await supabase
        .from("users")
        .select("id, username, display_name, avatar, verified")
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20)

    if (error) throw error
    return data
}

export async function fetchFollowers(userId: string) {

    const { data, error } = await supabase
        .from("follows")
        .select(`
            follower_id,
            users!follows_follower_id_fkey (
                id,
                username,
                avatar_url
            )
            `)
        .eq("following_id", userId)

        if (error) throw new Error("Couldn't load followers, try again.");

        return data
}

export async function fetchFollowing(userId: string) {

    const { data, error } = await supabase
        .from("follows")
        .select(`
            following_id,
            users!follows_follower_id_fkey (
                id,
                username,
                avatar_url
            )
            `)
        .eq("follower_id", userId)

        if (error) throw new Error("Couldn't load following, try again.");
        
        return data
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
    .limit(5)

  if (error) throw error

  return data ?? []
}