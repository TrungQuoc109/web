import { io, type Socket } from "socket.io-client";

import { env } from "@/shared/config/env";

let realtimeSocket: Socket | null = null;
let currentToken: string | null = null;

export function getRealtimeSocket(token: string) {
  if (realtimeSocket && currentToken === token) {
    return realtimeSocket;
  }

  if (realtimeSocket) {
    realtimeSocket.disconnect();
    realtimeSocket = null;
  }

  currentToken = token;
  realtimeSocket = io(`${env.apiUrl}/realtime`, {
    auth: {
      token: `Bearer ${token}`,
    },
    transports: ["websocket"],
    autoConnect: true,
  });

  return realtimeSocket;
}

export function disconnectRealtimeSocket() {
  if (realtimeSocket) {
    realtimeSocket.disconnect();
    realtimeSocket = null;
  }

  currentToken = null;
}
