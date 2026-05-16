import { supabase } from "./supabase"

export async function getUnreadCount({
    groupId,
    userId,
}: {
    groupId: string;
    userId: string;
}) {

    const { data: membership } = await supabase
        .from("group_members")
        .select("last_read_at")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .single();

        if (!membership) {
            throw new Error("Not a member of this group");
        }

        const lastRead = membership.last_read_at ?? new Date(0).toISOString();

        const { count, error } = await supabase 
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("group_id", groupId)
            .gt("created_at", lastRead);

            if (error) throw error;

            return count ?? 0;
}

export async function markAsRead({
    groupId,
    userId,
}: {
    groupId: string;
    userId: string;
}) {
    const { error } = await supabase
        .from("group_members")
        .update({ last_read_at: new Date().toISOString() })
        .eq("group_id", groupId)
        .eq("user_id", userId);

    if (error) throw error;

    await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

    return true;
}