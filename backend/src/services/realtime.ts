import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { supabase } from "./supabase";
import { sendPushNotification } from "./notifications";
import { NotifyPayload, NOTIFICATION_META } from "../../../shared/notificationTypes";

let io: SocketIOServer | null = null;

export function initRealtime(httpServer: HTTPServer) {
    const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
        .split(",").map(o => o.trim()).filter(Boolean);

    io = new SocketIOServer(httpServer, {
        cors: { origin: allowedOrigins.length ? allowedOrigins : undefined },
    });

    io.use((socket: Socket, next) => {
        const token = socket.handshake.auth?.token as string | undefined;
        if (!token) return next(new Error("Missing token"));
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
            (socket as any).userId = decoded.userId;
            next();
        } catch {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket: Socket) => {
        const userId = (socket as any).userId as string;
        socket.join(`user:${userId}`);
        console.log(`[realtime] socket connected for user ${userId}`);

        // Typing indicators are ephemeral — relayed directly to the other
        // group members' rooms, never persisted or routed through notifyUser.
        socket.on("typing:start", ({ groupId }: { groupId?: string }) => {
            if (!groupId) return;
            emitToGroup(groupId, "typing:start", { groupId, userId }, userId).catch(console.error);
        });
        socket.on("typing:stop", ({ groupId }: { groupId?: string }) => {
            if (!groupId) return;
            emitToGroup(groupId, "typing:stop", { groupId, userId }, userId).catch(console.error);
        });
    });
}

export function emitToUser(userId: string, event: string, payload: unknown) {
    io?.to(`user:${userId}`).emit(event, payload);
}

export async function emitToGroup(
    groupId: string, event: string, payload: unknown, excludeUserId?: string,
) {
    const { data: members } = await supabase
        .from("group_members").select("user_id").eq("group_id", groupId);
    for (const m of members ?? []) {
        if (m.user_id === excludeUserId) continue;
        emitToUser(m.user_id, event, payload);
    }
}

export async function notifyUser(
    userId: string | null,
    notification: NotifyPayload,
    opts: { skipPanel?: boolean } = {},
): Promise<void> {
    if (!userId) return;

    const title = notification.title ?? NOTIFICATION_META[notification.type].title;
    let row: any = { ...notification, title, user_id: userId };

    if (!opts.skipPanel) {
        const { data, error } = await supabase.from("notifications").insert({
            user_id: userId,
            type: notification.type,
            title,
            body: notification.body,
            reference_id: notification.reference_id,
            reference_type: notification.reference_type,
            metadata: notification.metadata ?? {},
        }).select().single();
        if (error) console.error(`[notifyUser] insert failed for ${userId}:`, error);
        else row = data;
    }

    emitToUser(userId, "notification", row);

    try {
        const { data: pushRow } = await supabase
            .from("push_tokens").select("token").eq("user_id", userId).maybeSingle();
        if (pushRow?.token) {
            await sendPushNotification(
                pushRow.token,
                title,
                truncateForPush(notification.body),
                {
                    type: notification.type,
                    reference_id: notification.reference_id,
                    reference_type: notification.reference_type,
                    ...notification.metadata,
                },
                notification.imageUrl,
            );
        }
    } catch (err) {
        console.error(`[notifyUser] push failed for ${userId}:`, err);
    }
}

// Full content is preserved in the notifications row / socket emit — only the
// OS push body is capped, since platforms already truncate long text with an
// ellipsis mid-word and this keeps that cut point sane instead of arbitrary.
const PUSH_BODY_MAX_LENGTH = 150;

function truncateForPush(body?: string): string {
    if (!body) return "";
    if (body.length <= PUSH_BODY_MAX_LENGTH) return body;
    return `${body.slice(0, PUSH_BODY_MAX_LENGTH - 1).trimEnd()}…`;
}
