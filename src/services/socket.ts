import { io, Socket } from "socket.io-client";
import { getToken } from "./secureStorage";

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket | null> {
    if (socket?.connected) return socket;
    const token = await getToken();
    if (!token) return null;
    socket = io(process.env.EXPO_PUBLIC_API_URL!, {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
    });
    return socket;
}

export function disconnectSocket() {
    socket?.disconnect();
    socket = null;
}

export function getSocket(): Socket | null {
    return socket;
}
