import { supabase } from "../services/supabase";
import { notifyUser, emitToUser, emitToGroup } from "../services/realtime";

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
                senderName,
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
    type?: "text" | "image" | "video" | "audio" | "gif" | "file" | "poll";
    media?: {
        uri?: string; thumbnail?: string; duration?: number; filename?: string; size?: number; mimeType?: string;
        options?: { id: string; text: string }[]; multiSelect?: boolean;
    };
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
        .select("username, display_name, avatar")
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

    // Fan out a live socket event plus a skip-panel notify (for push, when the
    // recipient isn't connected) to every other member of the group.
    const { data: members } = await supabase
        .from("group_members").select("user_id").eq("group_id", groupId).neq("user_id", userId);
    for (const m of members ?? []) {
        notifyUser(m.user_id, {
            type: "chat_message",
            title: user?.display_name ?? user?.username ?? "Unknown",
            body: content,
            reference_id: groupId,
            reference_type: "group",
            metadata: { groupId },
            imageUrl: user?.avatar ?? undefined,
        }, { skipPanel: true }).catch(console.error);
        emitToUser(m.user_id, "chat:message", message);
    }

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
            await notifyUser(mentioned.id, {
                type: "chat_mention",
                body: content,
                reference_id: groupId,
                reference_type: "group",
                metadata: { groupId },
                imageUrl: user?.avatar ?? undefined,
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
    requestingUserId,
    targetUserId,
}: {
    groupId: string;
    requestingUserId: string;
    targetUserId: string;
}) {

    const { data: admin, error: adminError } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", requestingUserId)
        .eq("role", "admin")
        .single();

    if (!admin || adminError) {
        throw new Error("No admin priviledges");
    }

    if (targetUserId === requestingUserId) {
        throw new Error("Admin cannot be removed");
    }

    const { data: targetUser } = await supabase
        .from("users")
        .select("username, display_name")
        .eq("id", targetUserId)
        .single();

    const { error: removeError } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", targetUserId);


        if (removeError) throw removeError;

        await notifyUser(targetUserId, {
            type: "chat_removed_from_group",
            body: "You were removed from the group",
            reference_id: groupId,
            reference_type: "group",
            metadata: { groupId },
        });

        // Remaining members' member list needs to reflect the removal live too —
        // skip their panel since this isn't "their" notification, just a live sync.
        const { data: remainingMembers } = await supabase
            .from("group_members").select("user_id").eq("group_id", groupId);
        for (const m of remainingMembers ?? []) {
            notifyUser(m.user_id, {
                type: "chat_removed_from_group",
                body: `${targetUser?.display_name ?? targetUser?.username ?? "A member"} was removed from the group`,
                reference_id: groupId,
                reference_type: "group",
                metadata: { groupId, removedUserId: targetUserId },
            }, { skipPanel: true }).catch(console.error);
        }

        return {
            success: true
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

  console.log("[fetchMessages] groupId:", groupId, "userId:", userId);
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
      senderName,
      type,
      media,
      reply_to,
      poll_votes ( user_id, option_id )
    `)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return { messages };
}

export async function votePoll({
    messageId,
    userId,
    optionIds,
}: {
    messageId: string;
    userId: string;
    optionIds: string[];
}) {
    const { data: message, error: fetchError } = await supabase
        .from("messages")
        .select("group_id, type, media")
        .eq("id", messageId)
        .single();

    if (fetchError || !message) throw new Error("Message not found");
    if (message.type !== "poll") throw new Error("Not a poll message");

    const { data: member } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", message.group_id)
        .eq("user_id", userId)
        .single();

    if (!member) throw new Error("Not a group member");

    const validOptionIds = new Set((message.media?.options ?? []).map((o: { id: string }) => o.id));
    const chosen = optionIds.filter(id => validOptionIds.has(id));

    const { error: deleteError } = await supabase
        .from("poll_votes")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", userId);
    if (deleteError) throw deleteError;

    if (chosen.length > 0) {
        const { error: insertError } = await supabase
            .from("poll_votes")
            .insert(chosen.map(optionId => ({ message_id: messageId, user_id: userId, option_id: optionId })));
        if (insertError) throw insertError;
    }

    const { data: votes, error: votesError } = await supabase
        .from("poll_votes")
        .select("user_id, option_id")
        .eq("message_id", messageId);
    if (votesError) throw votesError;

    emitToGroup(message.group_id, "poll:update", { messageId, votes }).catch(console.error);

    return { votes };
}

export async function leaveGroup({
  groupId,
  userId,
}: {
  groupId: string;
  userId: string;
}) {

  const { data: user } = await supabase
    .from("users")
    .select("username, display_name")
    .eq("id", userId)
    .single();

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) throw error;

  // Notify the remaining members — the leaver has already navigated away
  // client-side, so they're not the useful recipient here.
  const { data: members } = await supabase
    .from("group_members").select("user_id").eq("group_id", groupId);
  for (const m of members ?? []) {
    notifyUser(m.user_id, {
      type: "chat_member_left",
      body: `${user?.display_name ?? user?.username ?? "Someone"} left the group`,
      reference_id: groupId,
      reference_type: "group",
      metadata: { groupId },
    }).catch(console.error);
  }

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

  // Fetch remaining members before the group_members rows are gone —
  // there'd be nobody left to look up otherwise.
  const { data: members } = await supabase
    .from("group_members").select("user_id").eq("group_id", groupId).neq("user_id", userId);

  await supabase.from("messages").delete().eq("group_id", groupId);
  await supabase.from("group_members").delete().eq("group_id", groupId);
  await supabase.from("groups").delete().eq("id", groupId);

  for (const m of members ?? []) {
    notifyUser(m.user_id, {
      type: "chat_group_deleted",
      body: "This group was deleted",
      reference_id: groupId,
      reference_type: "group",
      metadata: { groupId },
    }).catch(console.error);
  }

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

  const { data: targetUser } = await supabase
    .from("users")
    .select("username, display_name")
    .eq("id", targetUserId)
    .single();

  await notifyUser(targetUserId, {
            type: "chat_made_admin",
            body: "You are now an admin",
            reference_id: groupId,
            reference_type: "group",
            metadata: { groupId },
            });

  // Other members' member list needs the new role live too.
  const { data: otherMembers } = await supabase
    .from("group_members").select("user_id").eq("group_id", groupId).neq("user_id", targetUserId);
  for (const m of otherMembers ?? []) {
    notifyUser(m.user_id, {
      type: "chat_made_admin",
      body: `${targetUser?.display_name ?? targetUser?.username ?? "A member"} is now an admin`,
      reference_id: groupId,
      reference_type: "group",
      metadata: { groupId, promotedUserId: targetUserId },
    }, { skipPanel: true }).catch(console.error);
  }

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

    const pinned = !message.is_pinned;
    emitToGroup(groupId, "chat:pin", { messageId, pinned }, userId).catch(console.error);

    return { pinned };
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
        .select("sender_id, deleted_for, group_id")
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
        emitToGroup(message.group_id, "chat:delete", { messageId, deleteFor: "everyone" }, userId).catch(console.error);
        return { deleted: "everyone" };
    }

    // delete for me — append userId to deleted_for array
    const already = message.deleted_for ?? [];
    const { error } = await supabase
        .from("messages")
        .update({ deleted_for: [...already, userId] })
        .eq("id", messageId);
    if (error) throw error;
    // Only this user's own devices should hide it — other members must still see it.
    emitToUser(userId, "chat:delete", { messageId, deleteFor: "me" });
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
