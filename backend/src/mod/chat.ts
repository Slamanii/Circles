import { supabase } from "../services/supabase";
import { sendPushNotification } from "../services/notifications"

export async function createGroupChat(
    creatorId: string, groupName: string, eventId: string
) {

    const { data: group, error } = await supabase
        .from("groups")
        .insert({
            name: groupName,
            created_by: creatorId,
            event_id: eventId,
            is_event_group: true,
        })
        .select()
        .single();

        if (error) throw error;

        await supabase.from("group_members").insert({
            group_id: group.id,
            user_id: creatorId,
            role: "admin",
        })

    return group;
} 

export async function getGroup(groupId: string, userId: string) {

    const { data: group, error } = await supabase
        .from("groups")
        .select(`
            *,
            group_members (
                user_id,
                role,
                muted,
                users (
                    id,
                    username,
                    avatar
                )
            ),
            messages (
                id,
                content,
                type,
                sender_id,
                created_at,
                media,
                reply_to
            )
            `)
            .eq("id", groupId)
            .single();

        if (error) throw error;

        const { data: member } = await supabase
            .from("group_members")
            .select("id")
            .eq("group_id", groupId)
            .eq("user_id", userId)
            .single();

        if (!member) throw new Error("Not a group member");

    return {
        group,
        member
    };
}

export async function sendMessage({
    groupId,
    userId,
    content,
    type = "text",
    media,
    replyTo,
}: {
    groupId: string;
    userId: string;
    content: string;
    type?: "text" | "image" | "video" | "audio";
    media?: { uri: string; thumbnail?: string; duration?: number };
    replyTo?: string;
}) {
    const { data: member } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .single();

    if (!member) throw new Error("Not a group member");

    const { data: user } = await supabase
        .from("users")
        .select("username, display_name")
        .eq("id", userId)
        .single();

    const { data: message, error } = await supabase
        .from("messages")
        .insert({
            group_id: groupId,
            sender_id: userId,
            senderName: user?.display_name ?? user?.username ?? "Unknown",
            content,
            type,
            media: media ?? null,
            reply_to: replyTo ?? null,
            status: "sent",
        })
        .select()
        .single();

    if (error) throw error;

    // Device push for all group members is handled client-side — each member's
    // NotificationProvider subscribes to the messages table and fires a local
    // push notification showing sender name + content preview.
    // The notifications table is only used for in-app panel entries (mentions, events, etc).

    // @mentioned users get an in-app panel notification as well as the device push
    const mentionMatches = content.match(/@(\w+)/g) ?? [];
    for (const mention of mentionMatches) {
        const username = mention.slice(1);
        const { data: mentioned } = await supabase
            .from("users")
            .select("id")
            .eq("username", username)
            .single();
        if (mentioned && mentioned.id !== userId) {
            await supabase.from("notifications").insert({
                user_id: mentioned.id,
                type: "mention",
                title: `${user?.username ?? "Someone"} mentioned you`,
                body: content,
                reference_id: groupId,
                reference_type: "group",
            });
        }
    }

    return message;
}

export async function starMessage(userId: string, messageId: string) {
    const { data, error } = await supabase
        .from("starred_messages")
        .upsert({ user_id: userId, message_id: messageId }, { onConflict: "user_id,message_id" })
        .select()
        .single();
    if (error) throw error;
    return { starred: true, id: data.id };
}

export async function unstarMessage(userId: string, messageId: string) {
    const { error } = await supabase
        .from("starred_messages")
        .delete()
        .eq("user_id", userId)
        .eq("message_id", messageId);
    if (error) throw error;
    return { starred: false };
}

export async function fetchStarredIds(userId: string, groupId: string) {
    const { data } = await supabase
        .from("starred_messages")
        .select("message_id, messages!inner(group_id)")
        .eq("user_id", userId)
        .eq("messages.group_id", groupId);
    return (data ?? []).map((r: any) => r.message_id as string);
}


export async function removeMember({
    groupId, 
    userId,
}: {
    groupId: string;
    userId: string;
}) { 

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: admin, error: adminError } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

    if (!admin || adminError) {
        throw new Error("No admin priviledges");
    }

    if (userId === user.id) {
        throw new Error("Admin cannot be removed");
    }

    const { error: removeError } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);


        if (removeError) throw removeError;

        await supabase.from("notifications").insert({
            user_id: userId,
            type: "chat",
            title: "New Message",
            body: "You were removed from the group",
            reference_id: groupId,
            reference_type: "group"
            });

        return {
            succes: true
        };
}

export async function fetchMessages({
  groupId,
  userId,
  limit = 50,
}: {
  groupId: string;
  userId: string;
  limit?: number;
}) {

  // Check membership
  const { data: member } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();

  if (!member) {
    throw new Error("Not a group member");
  }

  const { data: messages, error } = await supabase
    .from("messages")
    .select(`
      id,
      content,
      created_at,
      sender_id,
      users (
        id,
        username,
        avatar_url
      )
    `)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return { messages };
}

export async function leaveGroup({
  groupId,
  userId,
}: {
  groupId: string;
  userId: string;
}) {

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) throw error;

  await supabase.from("notifications").insert({
            user_id: userId,
            type: "chat",
            title: "New Message",
            body: "You left the group.",
            reference_id: groupId,
            reference_type: "group"
            });

  return { success: true };
}


export async function deleteGroup({
  groupId,
  userId,
}: {
  groupId: string;
  userId: string;
}) {

  // Check if admin
  const { data: admin } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .single();

  if (!admin || admin.role !== "admin") {
    throw new Error("Only admin can delete group");
  }

  await supabase.from("messages").delete().eq("group_id", groupId);
  await supabase.from("group_members").delete().eq("group_id", groupId);
  await supabase.from("groups").delete().eq("id", groupId);

  return { success: true };
}

export async function makeAdmin({
  groupId,
  targetUserId,
  currentUserId,
}: {
  groupId: string;
  targetUserId: string;
  currentUserId: string;
}) {

  // Verify current user is admin
  const { data: admin } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", currentUserId)
    .single();

  if (!admin || admin.role !== "admin") {
    throw new Error("No admin privileges");
  }

  const { error } = await supabase
    .from("group_members")
    .update({ role: "admin" })
    .eq("group_id", groupId)
    .eq("user_id", targetUserId);

  if (error) throw error;

  await supabase.from("notifications").insert({
            user_id: targetUserId,
            type: "chat",
            title: "New Message",
            body: "You are now an admin",
            reference_id: groupId,
            reference_type: "group"
            });

  return { success: true };
}

export async function pinMessage({
    messageId,
    userId,
    groupId,
}: {
    messageId: string;
    userId: string;
    groupId: string;
}) {
    // verify user is a member
    const { data: member } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", userId)
        .single();

    if (!member) throw new Error("Not a group member");

    const { data: message, error: fetchError } = await supabase
        .from("messages")
        .select("is_pinned")
        .eq("id", messageId)
        .single();

    if (fetchError || !message) throw new Error("Message not found");

    const { error } = await supabase
        .from("messages")
        .update({ is_pinned: !message.is_pinned })
        .eq("id", messageId);

    if (error) throw error;

    return { pinned: !message.is_pinned };
}

export async function deleteMessage({
    messageId,
    userId,
    deleteFor,
}: {
    messageId: string;
    userId: string;
    deleteFor: "me" | "everyone";
}) {
    // fetch message to verify sender
    const { data: message, error: fetchError } = await supabase
        .from("messages")
        .select("sender_id, deleted_for")
        .eq("id", messageId)
        .single();

    if (fetchError || !message) throw new Error("Message not found");

    if (deleteFor === "everyone") {
        if (message.sender_id !== userId) {
            throw new Error("Only the sender can delete for everyone");
        }
        const { error } = await supabase
            .from("messages")
            .update({ deleted: true, content: "This message was deleted" })
            .eq("id", messageId);
        if (error) throw error;
        return { deleted: "everyone" };
    }

    // delete for me — append userId to deleted_for array
    const already = message.deleted_for ?? [];
    const { error } = await supabase
        .from("messages")
        .update({ deleted_for: [...already, userId] })
        .eq("id", messageId);
    if (error) throw error;
    return { deleted: "me" };
}

export async function fetchUserGroups(userId: string) {

    const { data, error } = await supabase
        .from("group_members")
        .select(`
            groups (
                id,
                name,
                group_image,
                is_event_group,
                event_id,
                messages (
                    content,
                    created_at
                )
            )
        `)
        .eq("user_id", userId)
        .order("joined_at", { ascending: false })

    if (error) throw error
    return data
}

export async function fetchUnreadNotifications(userId: string) {

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return { count };
}

export async function markNotificationsRead(userId: string) {

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return { success: true };
}
export async function fetchNotifications(userId: string, limit = 30, offset = 0) {
    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    return data ?? [];
}
