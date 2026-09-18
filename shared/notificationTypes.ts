export const NOTIFICATION_TYPES = [
    "chat_message",                    // fan-out on every group message (skipPanel)
    "chat_mention",                    // @mentioned in a group message
    "chat_removed_from_group",         // an admin removed you
    "chat_member_left",                // a member left a group you're in
    "chat_made_admin",                 // you were promoted to admin
    "chat_group_deleted",              // the group you were in was deleted
    "follow_new",                      // someone followed you
    "event_liked",                     // someone liked your event
    "event_mint_complete",             // your event's ticket mint finished
    "event_mint_failed",               // your event's ticket mint failed
    "story_liked",                     // someone liked your story
    "collectible_received",            // an in-app ticket transfer landed in your wallet
    "collectible_purchase_confirmed",  // wallet or Paystack purchase claimed your tickets
    "wallet_reservation_refunded",     // a lapsed reservation's payment was refunded
] as const;

export type NotificationType = typeof NOTIFICATION_TYPES[number];

// Fallback title per type — used when a call site doesn't pass an explicit title.
export const NOTIFICATION_META: Record<NotificationType, { title: string }> = {
    chat_message: { title: "New message" },
    chat_mention: { title: "You were mentioned" },
    chat_removed_from_group: { title: "Removed from group" },
    chat_member_left: { title: "Member left" },
    chat_made_admin: { title: "You're now an admin" },
    chat_group_deleted: { title: "Group deleted" },
    follow_new: { title: "New follower" },
    event_liked: { title: "New like" },
    event_mint_complete: { title: "Minting complete" },
    event_mint_failed: { title: "Minting failed" },
    story_liked: { title: "New like" },
    collectible_received: { title: "Ticket received" },
    collectible_purchase_confirmed: { title: "Purchase confirmed" },
    wallet_reservation_refunded: { title: "Reservation expired" },
};

// Shape of a row in the `notifications` table.
export type NotificationRow = {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    body?: string | null;
    reference_id?: string | null;
    reference_type?: string | null;
    metadata?: Record<string, any>;
    is_read: boolean;
    created_at: string;
};

// Shape passed into notifyUser() — title is optional; falls back to NOTIFICATION_META.
export type NotifyPayload = {
    type: NotificationType;
    title?: string;
    body?: string;
    reference_id?: string;
    reference_type?: string;
    metadata?: Record<string, any>;
    // Sender/subject avatar — surfaced as the push notification's image when present
    // (e.g. the message sender's avatar for chat_message/chat_mention).
    imageUrl?: string;
};
